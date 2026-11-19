type VideoPort = Pick<HTMLVideoElement, 'currentTime' | 'duration' | 'readyState' | 'seeking' | 'pause' | 'addEventListener' | 'removeEventListener'>;

/** A paused video whose time is an absolute function of scroll progress.
 * It never calls play(), uses negative playback rates, or accumulates deltas. */
export class VideoScrubber {
  private progress = 0;
  private disposed = false;
  private readonly video: VideoPort;
  private readonly onReady = () => this.flush();

  constructor(video: VideoPort) {
    this.video = video;
    video.pause();
    video.addEventListener('loadedmetadata', this.onReady);
    video.addEventListener('seeked', this.onReady);
  }

  setProgress(progress: number) {
    this.progress = Math.min(1, Math.max(0, progress));
    this.flush();
  }

  get hasCurrentFrame() {
    const video = this.video;
    return video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - this.targetTime) <= 1 / 120;
  }

  private get targetTime() {
    return this.progress * Math.max(0, this.video.duration - 1 / 120);
  }

  private flush() {
    const video = this.video;
    if (this.disposed || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;
    const target = this.targetTime;
    if (Math.abs(video.currentTime - target) <= 1 / 120) return;
    // While one seek is pending, setProgress only replaces the target. seeked
    // then jumps directly to the newest position, in either direction.
    video.currentTime = target;
  }

  dispose() {
    this.disposed = true;
    this.video.pause();
    this.video.removeEventListener('loadedmetadata', this.onReady);
    this.video.removeEventListener('seeked', this.onReady);
  }
}
