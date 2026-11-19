import {mapTimeline} from './timeline.ts';

export type Pose = {at: number; x: number; y: number; scale: number; opacity: number};
type Track = {desktop: readonly Pose[]; mobile: readonly Pose[]};
const pose = (at: number, x: number, y: number, scale = 1, opacity = 1): Pose => ({at, x, y, scale, opacity});

/** These are spatial trajectories, not equally sized page/entrance windows.
 * Adjacent passages overlap, and their reading positions follow the camera. */
export const choreography: Record<string, Track> = {
  opening: {
    desktop: [pose(0,0,0), pose(.018,0,0), pose(.032,0,0), pose(.071,0,-2,1,0)],
    mobile: [pose(0,0,0), pose(.018,0,0), pose(.032,0,0), pose(.071,0,-2,1,0)],
  },
  crew: {
    desktop: [pose(.077,61,55,1,0), pose(.107,61,55), pose(.172,61,55), pose(.20,61,54,1,0)],
    mobile: [pose(.077,7,65,1,0), pose(.107,7,65), pose(.172,7,65), pose(.20,7,64,1,0)],
  },
  mythology: {
    desktop: [pose(.31,63,58,1,0), pose(.336,63,58), pose(.412,63,58), pose(.438,64,58,1,0)],
    mobile: [pose(.31,7,66,1,0), pose(.336,7,66), pose(.412,7,66), pose(.438,8,66,1,0)],
  },
  trading: {
    desktop: [pose(.44,7,65,1,0), pose(.463,7,65), pose(.53,7,65), pose(.558,6,65,1,0)],
    mobile: [pose(.44,7,67,1,0), pose(.463,7,67), pose(.53,7,67), pose(.558,6,67,1,0)],
  },
  lingdong: {
    desktop: [pose(.56,7,68,1,0), pose(.584,7,68), pose(.637,7,68), pose(.655,7,66,1,0)],
    mobile: [pose(.56,7,66,1,0), pose(.584,7,66), pose(.637,7,66), pose(.655,7,64,1,0)],
  },
  question: {
    desktop: [pose(.721,0,44,1,0), pose(.736,0,44), pose(.783,0,44), pose(.799,0,44,1,0)],
    mobile: [pose(.721,0,43,1,0), pose(.736,0,43), pose(.783,0,43), pose(.799,0,43,1,0)],
  },
  ending: {
    desktop: [pose(.843,7,33,1,0), pose(.859,7,30), pose(1,7,30)],
    mobile: [pose(.843,0,43,1,0), pose(.859,0,40), pose(1,0,40)],
  },
};

export function sampleTrack(track: readonly Pose[], progress: number): Pose {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= track[0].at) return {...track[0]};
  const last = track[track.length - 1];
  if (p >= last.at) return {...last};
  const next = track.findIndex(frame => frame.at >= p);
  const a = track[next - 1], b = track[next];
  const t = (p - a.at) / (b.at - a.at);
  const mix = (start: number, end: number) => start + (end - start) * t;
  return {at: p, x: mix(a.x,b.x), y: mix(a.y,b.y), scale: mix(a.scale,b.scale), opacity: mix(a.opacity,b.opacity)};
}

// Keep the Earth frame held while the closing title and project controls are available.
export const filmPosition = (p: number) => mapTimeline(p,
  [0,.077,.107,.20,.31,.44,.56,.655,.72,.80,.89,1],
  [0,2.48,3.25,6,10.55,16.1,19.9,22.7,25.67,26.5,30.0833,30.0833].map(t => t / 30.0833));

export const journeyDestinations: Record<string, number> = {
  departure: 0, crew: .14, mythology: .37, trading: .50, lingdong: .61,
  unknown: .76, homecoming: .875, projects: 1, end: 1,
};
