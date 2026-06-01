import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  annotationParts,
  annotationTransform,
  axisThresholdPath,
  declutterLabels,
  bandSubjectPath,
  bracketSubjectPath,
  circleSubjectPath,
  comparisonBracePath,
  connectorEndArrow,
  connectorEndDot,
  connectorCurve,
  connectorElbow,
  connectorLine,
  evidenceMarkerPath,
  notePlacement,
  noteTransform,
  outlierClusterPath,
  rectSubjectPath,
  slopeSubjectPath,
  thresholdPath,
  timelineEventPath,
} from '../annotations/index.js';

test('annotationTransform uses stable SVG translate output', () => {
  assert.equal(annotationTransform(), 'translate(0, 0)');
  assert.equal(annotationTransform({ x: 12.3456, y: -0 }), 'translate(12.346, 0)');
  assert.equal(noteTransform({ dx: 100, dy: 40 }), 'translate(100, 40)');
  assert.equal(
    noteTransform({
      x: 100,
      y: 40,
      align: 'middle',
      valign: 'bottom',
      width: 80,
      height: 20,
    }),
    'translate(60, 20)',
  );
});

test('subject helpers return deterministic path strings', () => {
  assert.equal(
    circleSubjectPath({ radius: 12.3456 }),
    'M0,-12.346A12.346,12.346 0 1 1 0,12.346A12.346,12.346 0 1 1 0,-12.346Z',
  );
  assert.equal(rectSubjectPath({ width: 20, height: 10 }), 'M-10,-5H10V5H-10Z');
  assert.equal(
    rectSubjectPath({ width: 20, height: 10, x: 0, y: 0, padding: 2 }),
    'M-2,-2H22V12H-2Z',
  );
  assert.equal(thresholdPath({ x2: 20, y2: 0 }), 'M0,0L20,0');
  assert.equal(axisThresholdPath({ value: 12, start: 0, end: 90 }), 'M0,12L90,12');
  assert.equal(
    axisThresholdPath({ orientation: 'vertical', value: 12, start: 0, end: 90 }),
    'M12,0L12,90',
  );
  assert.equal(bracketSubjectPath({ x1: 0, y1: 0, x2: 80, y2: 0, depth: 10 }), 'M0,0V10H80V0');
  assert.equal(bracketSubjectPath({ x1: 0, y1: 0, x2: 0, y2: 80, depth: -10 }), 'M0,0H-10V80H0');
  assert.equal(
    bandSubjectPath({ x: 10, y: 20, width: 80, height: 30, padding: 3 }),
    'M7,17H93V53H7Z',
  );
  assert.equal(slopeSubjectPath({ x1: 0, y1: 60, x2: 80, y2: 10 }), 'M0,60L80,10');
  assert.equal(
    comparisonBracePath({ x1: 0, y1: 0, x2: 80, y2: 0, depth: 10 }),
    'M0,0C20,0 20,10 40,10C40,10 40,20 40,20C40,10 60,10 60,0C60,0 60,0 80,0',
  );
  assert.equal(
    comparisonBracePath({ x1: 0, y1: 0, x2: 0, y2: 80, depth: -10 }),
    'M0,0C0,20 -10,20 -10,40C-10,40 -20,40 -20,40C-10,40 -10,60 0,60C0,60 0,60 0,80',
  );
  assert.equal(
    outlierClusterPath({
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 10 },
      ],
      radius: 4,
    }),
    'M0,-4A4,4 0 1 1 0,4A4,4 0 1 1 0,-4ZM20,6A4,4 0 1 1 20,14A4,4 0 1 1 20,6Z',
  );
  assert.equal(timelineEventPath({ size: 10 }), 'M0,0L5,10H-5Z');
  assert.equal(timelineEventPath({ size: 10, direction: 'left' }), 'M0,0L-10,5V-5Z');
  assert.equal(evidenceMarkerPath({ width: 20, height: 10, padding: 2 }), 'M-12,-7H12V7H-12Z');
});

test('notePlacement chooses a bounded note side and returns a matching transform', () => {
  assert.deepEqual(
    notePlacement({
      x: 100,
      y: 60,
      width: 80,
      height: 30,
      bounds: { x: 0, y: 0, width: 240, height: 140 },
      preferred: 'right',
      gap: 24,
      padding: 8,
    }),
    {
      dx: 24,
      dy: 0,
      align: 'start',
      valign: 'middle',
      transform: 'translate(24, -15)',
    },
  );
  assert.deepEqual(
    notePlacement({
      x: 210,
      y: 60,
      width: 80,
      height: 30,
      bounds: { x: 0, y: 0, width: 240, height: 140 },
      preferred: 'right',
      gap: 24,
      padding: 8,
    }),
    {
      dx: -24,
      dy: 0,
      align: 'end',
      valign: 'middle',
      transform: 'translate(-104, -15)',
    },
  );
  assert.deepEqual(
    notePlacement({
      x: 120,
      y: 70,
      width: 300,
      height: 160,
      bounds: { x: 0, y: 0, width: 240, height: 140 },
      preferred: 'bottom',
      gap: 24,
      padding: 8,
    }),
    {
      dx: -112,
      dy: -62,
      align: 'start',
      valign: 'top',
      transform: 'translate(-112, -62)',
    },
  );
});

test('connectors draw from the subject anchor to the note offset', () => {
  assert.equal(connectorLine({ dx: 10, dy: 20 }), 'M0,0L10,20');
  assert.equal(connectorElbow({ dx: 100, dy: 40 }), 'M0,0L40,40L100,40');
  assert.equal(connectorCurve({ dx: 100, dy: 40 }), 'M0,0C35,0 65,40 100,40');
});

test('connectors trim line starts against circle and rect subjects', () => {
  assert.equal(
    connectorLine({
      dx: 100,
      dy: 0,
      subject: { type: 'circle', radius: 20, radiusPadding: 5 },
    }),
    'M25,0L100,0',
  );
  assert.equal(
    connectorLine({
      dx: 100,
      dy: 40,
      subject: { type: 'rect', width: 20, height: 20 },
    }),
    'M10,4L100,40',
  );
});

test('connector end helpers return deterministic SVG markers', () => {
  assert.equal(
    connectorEndDot({ x: 10, y: -5, radius: 2 }),
    'M10,-7A2,2 0 1 1 10,-3A2,2 0 1 1 10,-7Z',
  );
  assert.equal(connectorEndArrow({ x2: 10, y2: 0, size: 4 }), 'M10,0L6.398,1.74L6.398,-1.74Z');
});

test('annotationParts assembles common subject, connector and note paths', () => {
  assert.deepEqual(
    annotationParts({
      x: 10,
      y: 20,
      dx: 40,
      dy: -20,
      subject: { type: 'circle', radius: 10 },
      type: 'curve',
    }),
    {
      transform: 'translate(10, 20)',
      subject: 'M0,-10A10,10 0 1 1 0,10A10,10 0 1 1 0,-10Z',
      connector: 'M8.944,-4.472C19.814,-4.472 29.13,-20 40,-20',
      note: 'translate(40, -20)',
    },
  );
  assert.deepEqual(
    annotationParts({
      dx: 40,
      dy: 20,
      subject: { type: 'band', x: 0, y: 0, width: 60, height: 20, padding: 2 },
    }),
    {
      transform: 'translate(0, 0)',
      subject: 'M-2,-2H62V22H-2Z',
      connector: 'M0,0L40,20',
      note: 'translate(40, 20)',
    },
  );
  assert.equal(
    annotationParts({
      dx: 10,
      dy: 10,
      subject: { type: 'compare', x1: 0, y1: 0, x2: 80, y2: 0, depth: 10 },
    }).subject,
    'M0,0C20,0 20,10 40,10C40,10 40,20 40,20C40,10 60,10 60,0C60,0 60,0 80,0',
  );
  assert.equal(
    annotationParts({
      dx: 10,
      dy: 10,
      subject: { type: 'axis', orientation: 'vertical', value: 12, start: 0, end: 90 },
    }).subject,
    'M12,0L12,90',
  );
  assert.equal(
    annotationParts({
      dx: 10,
      dy: 10,
      subject: { type: 'timeline', size: 10, direction: 'up' },
    }).subject,
    'M0,0L5,-10H-5Z',
  );
  assert.equal(
    annotationParts({
      dx: 10,
      dy: 10,
      subject: { type: 'evidence', width: 20, height: 10, padding: 2 },
    }).subject,
    'M-12,-7H12V7H-12Z',
  );
});

test('helpers return blank paths when there is no drawable segment', () => {
  assert.equal(connectorLine({ dx: 0, dy: 0 }), '');
  assert.equal(connectorLine({ dx: 10, dy: 0, subject: { type: 'circle', radius: 10 } }), '');
  // trim that rounds onto the note anchor → empty, not a degenerate "M x,y L x,y"
  assert.equal(
    connectorLine({ dx: 1000, dy: 0, subject: { type: 'rect', width: 1999.999, height: 10 } }),
    '',
  );
  assert.equal(circleSubjectPath({ radius: 0 }), '');
  assert.equal(rectSubjectPath({ width: 0, height: 10 }), '');
  assert.equal(timelineEventPath({ size: 0 }), '');
  assert.equal(evidenceMarkerPath({ width: 0, height: 10 }), '');
  assert.equal(connectorEndArrow({ x2: 0, y2: 0 }), '');
});

test('helper output is rounded to three decimals', () => {
  assert.equal(connectorLine({ dx: 1 / 3, dy: 2 / 3 }), 'M0,0L0.333,0.667');
});

test('helpers reject invalid geometry', () => {
  assert.throws(() => circleSubjectPath({ radius: -1 }), RangeError);
  assert.throws(() => rectSubjectPath({ width: -1, height: 10 }), RangeError);
  assert.throws(() => axisThresholdPath({ orientation: 'diagonal', end: 10 }), TypeError);
  assert.throws(() => noteTransform({ align: 'left' }), TypeError);
  assert.throws(() => noteTransform({ valign: 'center' }), TypeError);
  assert.throws(
    () =>
      notePlacement({
        preferred: 'diagonal',
        width: 20,
        height: 10,
        bounds: { width: 40, height: 40 },
      }),
    TypeError,
  );
  assert.throws(
    () => notePlacement({ width: -1, height: 10, bounds: { width: 40, height: 40 } }),
    RangeError,
  );
  assert.throws(() => outlierClusterPath({ points: 'not-points' }), TypeError);
  assert.throws(() => timelineEventPath({ direction: 'forward' }), TypeError);
  assert.throws(() => connectorLine({ dx: Number.NaN, dy: 0 }), TypeError);
  assert.throws(() => connectorLine({ dx: 10, dy: 10, subject: { type: 'point' } }), TypeError);
  assert.throws(() => annotationParts({ subject: { type: 'point' } }), TypeError);
});

test('declutterLabels leaves non-overlapping labels in place', () => {
  const out = declutterLabels([
    { pos: 0, size: 10 },
    { pos: 40, size: 10 },
    { pos: 80, size: 10 },
  ]);
  assert.deepEqual(out, [0, 40, 80]);
});

test('declutterLabels separates overlapping labels by size + gap, order-preserving', () => {
  // three labels of size 10 all near 50 → centres must be >= 10 apart (+2 gap)
  const out = declutterLabels(
    [
      { pos: 50, size: 10 },
      { pos: 52, size: 10 },
      { pos: 48, size: 10 },
    ],
    { gap: 2 },
  );
  // output is in INPUT order; sort to check spacing
  const sorted = [...out].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(
      sorted[i] - sorted[i - 1] >= 12 - 1e-9,
      `gap >= 12 (got ${sorted[i] - sorted[i - 1]})`,
    );
  }
  assert.equal(out.length, 3);
});

test('declutterLabels sweeps up from min and slides to fit under max', () => {
  // two size-10 labels at 0 with min 0 → first centre 5, second 15
  assert.deepEqual(
    declutterLabels(
      [
        { pos: 0, size: 10 },
        { pos: 0, size: 10 },
      ],
      { min: 0 },
    ),
    [5, 15],
  );
  // overflow past max=18 slides the run up by 2 → [3, 13]
  assert.deepEqual(
    declutterLabels(
      [
        { pos: 0, size: 10 },
        { pos: 0, size: 10 },
      ],
      { min: 0, max: 18 },
    ),
    [3, 13],
  );
});

test('declutterLabels validates inputs', () => {
  assert.throws(() => declutterLabels('nope'), TypeError);
  assert.throws(() => declutterLabels([{ pos: NaN, size: 1 }]), TypeError);
  assert.throws(() => declutterLabels([{ pos: 0, size: -1 }]), RangeError);
  assert.throws(() => declutterLabels([], { min: 10, max: 0 }), RangeError);
});
