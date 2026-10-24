"""Fail closed on scan errors and findings without an exact reviewed exception."""

import hashlib
import json
from pathlib import Path
import sys


def source_hash(path, root):
    source = (root / path).resolve()
    if not source.is_relative_to(root.resolve()):
        raise ValueError("finding path escapes checkout")
    return hashlib.sha256(source.read_bytes()).hexdigest()


def identity(finding, root):
    path = finding["path"]
    rule_details = {name: finding["extra"][name] for name in ("message", "severity", "metadata")}
    return (
        finding["check_id"],
        path,
        finding["start"]["line"],
        finding["start"]["col"],
        finding["end"]["line"],
        finding["end"]["col"],
        source_hash(path, root),
        hashlib.sha256(json.dumps(rule_details, sort_keys=True).encode()).hexdigest(),
    )


def warning_identity(warning, root):
    return (warning["path"],
            hashlib.sha256(json.dumps(warning, sort_keys=True).encode()).hexdigest(),
            source_hash(warning["path"], root))


def reviewed_entries(entries):
    allowed = {}
    for entry in entries:
        if not entry["reason"].strip() or not entry["evidence"].strip():
            raise ValueError("exception requires rationale and evidence")
        key = tuple(entry["identity"])
        if key in allowed:
            raise ValueError("duplicate exception")
        allowed[key] = entry
    return allowed


def check(report, baseline, root):
    if not isinstance(report.get("results"), list) or not isinstance(report.get("errors"), list):
        raise ValueError("missing results/errors")
    if report.get("version") != baseline["scannerVersion"]:
        raise ValueError("scanner version changed; review the baseline")
    if not report["paths"]["scanned"]:
        raise ValueError("empty scan")
    warnings = reviewed_entries(baseline["parserWarnings"])
    for warning in report["errors"]:
        # Only exact, documented parser limitations may be reviewed. Execution
        # errors, timeouts and other diagnostic kinds cannot be baselined.
        if (warning.get("level") != "warn" or warning.get("code") != 3
                or not isinstance(warning.get("type"), list)
                or warning["type"][0] != "PartialParsing"):
            raise ValueError("scanner reported an execution/configuration error")
        key = warning_identity(warning, root)
        if key not in warnings:
            raise ValueError(f"unreviewed parser warning: {warning['message']}")
        del warnings[key]
        print(f"Reviewed parser limitation: {warning.get('message', warning['path'])}")
    allowed = reviewed_entries(baseline["exceptions"])
    failures = []
    for finding in report["results"]:
        key = identity(finding, root)
        if key not in allowed:
            failures.append(f"{finding['path']}:{finding['start']['line']}: {finding['check_id']}")
        else:
            # Consume once: a second occurrence cannot reuse one exception.
            del allowed[key]
    if failures:
        raise ValueError("unreviewed or changed findings:\n" + "\n".join(failures))
    print(f"Semgrep: {len(report['results'])} reviewed findings; {len(allowed)} stale exceptions")


if __name__ == "__main__":
    try:
        report_path, baseline_path = sys.argv[1:]
        check(json.loads(Path(report_path).read_text()),
              json.loads(Path(baseline_path).read_text()), Path.cwd())
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f"Semgrep gate failed: {error}", file=sys.stderr)
        sys.exit(1)
