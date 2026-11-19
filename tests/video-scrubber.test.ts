import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {VideoScrubber} from '../src/lib/video-scrubber.ts';

class TestVideo extends EventTarget {
  duration = 22;
  readyState = 1;
  seeking = false;
  writes: number[] = [];
  paused = false;
  private time = 0;
  get currentTime() {return this.time;}
  set currentTime(value: number) {this.time = value; this.seeking = true; this.writes.push(value);}
  pause() {this.paused = true;}
  finishSeek() {this.seeking = false; this.dispatchEvent(new Event('seeked'));}
}
const controller = (video: TestVideo) => new VideoScrubber(video as unknown as HTMLVideoElement);

test('advancing and rewinding return to precisely the same video time', () => {
  const video = new TestVideo(); const scrub = controller(video);
  scrub.setProgress(.23); video.finishSeek(); const first = video.currentTime;
  scrub.setProgress(.59); video.finishSeek(); assert.ok(video.currentTime > first);
  scrub.setProgress(.23); video.finishSeek(); assert.equal(video.currentTime, first);
  assert.equal(video.paused, true); scrub.dispose();
});

test('fast reversing replaces pending targets instead of queuing stale seeks', () => {
  const video = new TestVideo(); const scrub = controller(video);
  scrub.setProgress(.8); scrub.setProgress(.6); scrub.setProgress(.2);
  assert.equal(video.writes.length, 1);
  video.finishSeek(); assert.equal(video.writes.length, 2);
  assert.ok(Math.abs(video.currentTime - .2 * (22 - 1 / 120)) < 1e-10);
  scrub.dispose();
});

test('a target set before metadata is applied when duration becomes available', () => {
  const video = new TestVideo(); video.duration = NaN; video.readyState = 0;
  const scrub = controller(video); scrub.setProgress(.7); assert.equal(video.writes.length, 0);
  video.duration = 22; video.readyState = 1; video.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(video.writes.length, 1); scrub.dispose();
});

test('a poster can stay visible until the requested video frame is decoded', () => {
  const video = new TestVideo();
  const scrub = controller(video);
  scrub.setProgress(1);
  video.readyState = 2;
  assert.equal(scrub.hasCurrentFrame, false);
  video.finishSeek();
  assert.equal(scrub.hasCurrentFrame, true);
  scrub.setProgress(.5);
  assert.equal(scrub.hasCurrentFrame, false);
  scrub.dispose();
});

test('stopping scroll generates no more seeks, and endpoints stay inside the film', () => {
  const video = new TestVideo(); const scrub = controller(video);
  scrub.setProgress(2); video.finishSeek(); assert.ok(video.currentTime < video.duration);
  scrub.setProgress(1); assert.equal(video.writes.length, 1);
  scrub.setProgress(-1); video.finishSeek(); assert.equal(video.currentTime, 0);
  scrub.dispose();
});

test('disposing removes event listeners and ignores later input', () => {
  const video = new TestVideo(); const scrub = controller(video);
  scrub.dispose(); scrub.setProgress(.7); video.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(video.writes.length, 0);
});
