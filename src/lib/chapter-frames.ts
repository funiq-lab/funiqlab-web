export const chapterFrames = [
  {id: 'departure', from: 0, motion: 'opening', desktop: 'opener', portrait: 'portrait-opener'},
  {id: 'crew', from: .077, motion: 'crew', desktop: 'crew', portrait: 'crew-portrait'},
  {id: 'mythology', from: .31, motion: 'mythology', desktop: 'mythology', portrait: 'mythology-portrait'},
  {id: 'trading', from: .44, motion: 'trading', desktop: 'trading', portrait: 'trading-portrait'},
  {id: 'lingdong', from: .56, motion: 'lingdong', desktop: 'lingdong', portrait: 'lingdong-portrait'},
  {id: 'unknown', from: .72, motion: 'question', desktop: null, portrait: null},
  {id: 'homecoming', from: .80, motion: 'ending', desktop: 'homecoming', portrait: 'homecoming-portrait'},
  {id: 'end', from: .89, motion: 'ending', desktop: 'earth', portrait: 'portrait-earth'},
] as const;

export function chapterFrameAt(progress: number) {
  return chapterFrames.findLast(frame => progress >= frame.from) ?? chapterFrames[0];
}

export function chapterFrameURL(asset: string | null) {
  return asset ? `/media/voyage-${asset}.webp` : null;
}
