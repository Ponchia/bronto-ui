import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRECISION,
  anchorPoint,
  angleBetween,
  endTangentAngle,
  straightPath,
  elbowPath,
  curvePath,
  connectorPath,
  arrowHead,
  dotMark,
  roundNumber,
  finite,
  dimension,
  fmt,
  point,
  clamp,
  rectPath,
  autoSides,
  connectRects,
} from '../connectors/index.js';

const RECT = { x: 10, y: 20, width: 40, height: 30 };

test('low-level connector kernel helpers are deterministic and guarded', () => {
  assert.equal(PRECISION, 1000);
  assert.equal(roundNumber(1.23456), 1.235);
  assert.equal(roundNumber(-0), 0);
  assert.equal(fmt(-0), '0');
  assert.equal(point(1 / 3, -0), '0.333,0');
  assert.equal(clamp(4, 0, 1), 1);
  assert.equal(clamp(-1, 0, 1), 0);
  assert.equal(clamp(5, 10, 0), 10);
  assert.equal(finite('x', undefined, 2), 2);
  assert.equal(dimension('width', undefined, 3), 3);
  assert.equal(rectPath(0, 1, 10, 11), 'M0,1H10V11H0Z');
  assert.throws(() => finite('x', Infinity), TypeError);
  assert.throws(() => dimension('width', -1), RangeError);
});

test('anchorPoint returns edge/centre points', () => {
  assert.deepEqual(anchorPoint(RECT, 'top'), { x: 30, y: 20 });
  assert.deepEqual(anchorPoint(RECT, 'bottom'), { x: 30, y: 50 });
  assert.deepEqual(anchorPoint(RECT, 'left'), { x: 10, y: 35 });
  assert.deepEqual(anchorPoint(RECT, 'right'), { x: 50, y: 35 });
  assert.deepEqual(anchorPoint(RECT, 'center'), { x: 30, y: 35 });
  assert.deepEqual(anchorPoint(RECT), { x: 30, y: 35 });
});

test('path builders produce stable SVG strings', () => {
  assert.equal(straightPath({ x: 0, y: 0 }, { x: 100, y: 40 }), 'M0,0L100,40');
  // horizontal-dominant elbow turns on x at mid
  assert.equal(elbowPath({ x: 0, y: 0 }, { x: 100, y: 40 }), 'M0,0H50V40H100');
  // vertical-dominant elbow turns on y at mid
  assert.equal(elbowPath({ x: 0, y: 0 }, { x: 20, y: 100 }), 'M0,0V50H20V100');
  assert.equal(curvePath({ x: 0, y: 0 }, { x: 100, y: 40 }), 'M0,0C50,0 50,40 100,40');
});

test('connectorPath dispatches on shape', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 40 };
  assert.equal(connectorPath({ from, to }), straightPath(from, to));
  assert.equal(connectorPath({ from, to, shape: 'elbow' }), elbowPath(from, to));
  assert.equal(connectorPath({ from, to, shape: 'curve' }), curvePath(from, to));
});

test('connector path options propagate curvature and elbow midpoints', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 40 };
  assert.equal(curvePath(from, to, { curvature: 0.25 }), 'M0,0C25,0 75,40 100,40');
  assert.equal(
    connectorPath({ from, to, shape: 'curve', curvature: 0.75 }),
    'M0,0C75,0 25,40 100,40',
  );
  assert.equal(elbowPath(from, to, { mid: 0.25 }), 'M0,0H25V40H100');
  assert.equal(connectorPath({ from, to, shape: 'elbow', mid: 0.75 }), 'M0,0H75V40H100');

  const elbow = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 40, width: 20, height: 20 },
    shape: 'elbow',
    mid: 0.25,
  });
  assert.equal(elbow.d, 'M20,10H40V50H100');

  const curve = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 0, width: 20, height: 20 },
    shape: 'curve',
    curvature: 0.25,
  });
  assert.equal(curve.d, 'M20,10C40,10 80,10 100,10');
});

test('elbow midpoint clamps, while non-finite geometry options throw', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 40 };
  assert.equal(elbowPath(from, to, { mid: -1 }), 'M0,0H0V40H100');
  assert.equal(elbowPath(from, to, { mid: 2 }), 'M0,0H100V40H100');
  assert.throws(() => elbowPath(from, to, { mid: NaN }), TypeError);
  assert.throws(() => curvePath(from, to, { curvature: Infinity }), TypeError);
  assert.throws(() => connectorPath({ from, to, shape: 'curve', curvature: NaN }), TypeError);
  assert.throws(
    () =>
      connectRects({
        fromRect: { x: 0, y: 0, width: 20, height: 20 },
        toRect: { x: 100, y: 0, width: 20, height: 20 },
        shape: 'elbow',
        mid: Infinity,
      }),
    TypeError,
  );
});

test('connectorPath rejects unknown shapes instead of mixing path and tangent semantics', () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 40 };
  assert.throws(() => connectorPath({ from, to, shape: 'zigzag' }), TypeError);
  assert.throws(() => endTangentAngle(from, to, 'zigzag'), TypeError);
  assert.throws(
    () =>
      connectRects({
        fromRect: { x: 0, y: 0, width: 10, height: 10 },
        toRect: { x: 100, y: 40, width: 10, height: 10 },
        shape: 'zigzag',
      }),
    TypeError,
  );
});

test('angleBetween + arrowHead + dotMark', () => {
  assert.equal(angleBetween({ x: 0, y: 0 }, { x: 10, y: 0 }), 0);
  assert.equal(angleBetween({ x: 0, y: 0 }, { x: 0, y: 10 }), Math.PI / 2);
  // arrowHead returns a closed triangle path
  assert.match(arrowHead({ x: 50, y: 50 }, 0), /^M50,50L[\d.-]+,[\d.-]+L[\d.-]+,[\d.-]+Z$/);
  assert.match(dotMark({ x: 10, y: 10 }, 3), /^M10,7A3,3 0 1 1 10,13A3,3 0 1 1 10,7Z$/);
  assert.equal(dotMark({ x: 0, y: 0 }, 0), '');
});

test('arrowHead spread controls sharpness and is range-checked', () => {
  // A smaller spread keeps the barbs closer to the shaft → a crisper head.
  assert.equal(arrowHead({ x: 0, y: 0 }, 0, 10, 0.2), 'M0,0L-9.801,1.987L-9.801,-1.987Z');
  assert.notEqual(arrowHead({ x: 0, y: 0 }, 0, 10, 0.2), arrowHead({ x: 0, y: 0 }, 0, 10, 0.6));
  // The default is unchanged, so existing connector arrowheads don't move.
  assert.equal(arrowHead({ x: 0, y: 0 }, 0, 10), arrowHead({ x: 0, y: 0 }, 0, 10, 0.45));
  assert.throws(() => arrowHead({ x: 0, y: 0 }, 0, 10, 0), RangeError);
  assert.throws(() => arrowHead({ x: 0, y: 0 }, 0, 10, Math.PI), RangeError);
});

test('autoSides picks facing edges from relative position', () => {
  assert.deepEqual(
    autoSides({ x: 0, y: 0, width: 10, height: 10 }, { x: 100, y: 0, width: 10, height: 10 }),
    {
      from: 'right',
      to: 'left',
    },
  );
  assert.deepEqual(
    autoSides({ x: 0, y: 100, width: 10, height: 10 }, { x: 0, y: 0, width: 10, height: 10 }),
    {
      from: 'top',
      to: 'bottom',
    },
  );
});

test('connectRects resolves anchors, path, and angle', () => {
  const out = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 0, width: 20, height: 20 },
  });
  assert.deepEqual(out.from, { x: 20, y: 10 }); // right edge of from
  assert.deepEqual(out.to, { x: 100, y: 10 }); // left edge of to
  assert.equal(out.angle, 0);
  assert.equal(out.d, 'M20,10L100,10');
});

test('explicit sides + shape override auto', () => {
  const out = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 100, width: 20, height: 20 },
    fromSide: 'bottom',
    toSide: 'top',
    shape: 'elbow',
  });
  assert.deepEqual(out.from, { x: 10, y: 20 });
  assert.deepEqual(out.to, { x: 110, y: 100 });
});

test('endTangentAngle: chord for straight, axis-aligned for elbow/curve', () => {
  assert.equal(endTangentAngle({ x: 0, y: 0 }, { x: 10, y: 0 }, 'straight'), 0);
  assert.equal(endTangentAngle({ x: 0, y: 0 }, { x: 100, y: 40 }, 'elbow'), 0); // dx-dominant, +x
  assert.equal(endTangentAngle({ x: 0, y: 0 }, { x: -100, y: 40 }, 'elbow'), Math.PI); // -x
  assert.equal(endTangentAngle({ x: 0, y: 0 }, { x: 40, y: 100 }, 'curve'), Math.PI / 2); // dy-dominant
  assert.equal(endTangentAngle({ x: 0, y: 0 }, { x: 40, y: -100 }, 'curve'), -Math.PI / 2);
});

test('connectRects: elbow arrowhead angle is the end tangent, not the chord', () => {
  const out = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 100, width: 20, height: 20 },
    shape: 'elbow',
  });
  // arrives vertically (dy-dominant after anchoring) — axis-aligned, not the diagonal chord
  assert.equal(out.angle, Math.PI / 2);
});

test('connectRects: a one-sided override is honored; the other side auto-picks', () => {
  const out = connectRects({
    fromRect: { x: 0, y: 0, width: 20, height: 20 },
    toRect: { x: 100, y: 0, width: 20, height: 20 },
    fromSide: 'top',
  });
  assert.deepEqual(out.from, { x: 10, y: 0 }); // explicit 'top' respected
  assert.deepEqual(out.to, { x: 100, y: 10 }); // auto-picked 'left'
});

test('non-finite inputs throw', () => {
  assert.throws(() => straightPath({ x: NaN, y: 0 }, { x: 1, y: 1 }), TypeError);
  assert.throws(() => arrowHead({ x: 0, y: 0 }, 0, -5), RangeError);
  assert.throws(() => anchorPoint(undefined), TypeError);
  assert.throws(() => anchorPoint({ x: 0, y: 0, width: 10, height: 10 }, 'diagonal'), TypeError);
  assert.throws(() => connectRects({}), TypeError);
  assert.throws(
    () =>
      connectRects({
        fromRect: { x: 0, y: 0, width: 10, height: 10 },
        toRect: { x: 100, y: 0, width: 10, height: 10 },
        fromSide: 'diagonal',
      }),
    TypeError,
  );
});
