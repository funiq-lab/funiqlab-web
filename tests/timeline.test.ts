import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {mapTimeline} from '../src/lib/timeline.ts';

const anchors = [0, 900, 2160, 3420, 4680, 5670, 6030];
const cues = [0, 7 / 48, 15 / 48, 23 / 48, 31 / 48, 39 / 48, 1];

test('each chapter anchor lands on its editorial film cue', () => {
  anchors.forEach((anchor, index) => assert.equal(mapTimeline(anchor, anchors, cues), cues[index]));
  assert.equal(mapTimeline(-800, anchors, cues), 0);
  assert.equal(mapTimeline(10000, anchors, cues), 1);
});

test('variable chapter lengths interpolate independently and remain reversible', () => {
  for (let i = 0; i < anchors.length - 1; i++) {
    const center = (anchors[i] + anchors[i + 1]) / 2;
    const expected = (cues[i] + cues[i + 1]) / 2;
    assert.ok(Math.abs(mapTimeline(center, anchors, cues) - expected) < 1e-10);
  }
  const forward = Array.from({length: 50}, (_, i) => mapTimeline(i * 130, anchors, cues));
  const backward = Array.from({length: 50}, (_, i) => mapTimeline((49 - i) * 130, anchors, cues));
  assert.deepEqual(forward, backward.reverse());
});

test('resizing or translating the page does not move the film off its cues', () => {
  const changed = [0, 844, 1899, 3100, 4155, 5083, 5350];
  changed.forEach((anchor, i) => assert.equal(mapTimeline(anchor, changed, cues), cues[i]));
});

test('inconsistent timeline configuration fails explicitly', () => {
  assert.throws(() => mapTimeline(0, [0], [0]), /matching lengths/);
  assert.throws(() => mapTimeline(0, [0, 1], [0]), /matching lengths/);
});
