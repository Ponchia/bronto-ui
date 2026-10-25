"""Extract only reviewed regular source files from a pre-verified upstream archive."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
import tarfile


def extract(archive_path, policy_path, destination):
    policy = json.loads(Path(policy_path).read_text())
    expected = policy['files']
    target = Path(destination)
    if target.exists() or target.is_symlink():
        raise ValueError('Source destination must not already exist')
    target.mkdir(mode=0o700)
    observed = set()
    with tarfile.open(archive_path, 'r:gz') as archive:
        for member in archive:
            parts = PurePosixPath(member.name).parts
            if not parts or parts[0] != 'cli-' + policy['commit']:
                raise ValueError('Unexpected source archive root')
            relative = '/'.join(parts[1:])
            if relative not in expected:
                continue
            if relative in observed or not member.isfile() or member.size > 4 * 1024 * 1024:
                raise ValueError('Duplicate, linked or oversized reviewed source file')
            if '..' in parts or PurePosixPath(relative).is_absolute():
                raise ValueError('Unsafe source path')
            reader = archive.extractfile(member)
            if reader is None:
                raise ValueError('Missing source bytes')
            content = reader.read(4 * 1024 * 1024 + 1)
            if hashlib.sha256(content).hexdigest() != expected[relative]:
                raise ValueError('Source file differs from reviewed upstream bytes: ' + relative)
            path = target / relative
            path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
            with path.open('xb') as output:
                output.write(content)
            path.chmod(0o600)
            observed.add(relative)
    if observed != set(expected):
        raise ValueError('Reviewed source files are missing')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('Usage: extract-publisher-source.py ARCHIVE POLICY NEW_DIRECTORY')
    extract(*sys.argv[1:])
