export const projects = [
  {id: 'mythology', url: 'https://mythologystories.net'},
  {id: 'trading', url: 'https://funiq-trading.funiqlab.com'},
  {id: 'lingdong', url: 'https://github.com/yellinzero/lingdong-news'},
  {id: 'zero-agent', url: 'https://github.com/yellinzero/zero-agent-sdk'},
  {id: 'grid-maker', url: 'https://grid-maker.net'},
  {id: 'your-mind', url: 'https://github.com/funiq-lab/your-mind'},
  {id: 'daily-ai-learning-lab', url: 'https://github.com/yellinzero/daily-ai-learning-lab'},
  {id: 'name-with-bazi-astrology', url: 'https://github.com/yellinzero/name-with-bazi-astrology'},
] as const;

export const coreProjects = [projects[0], projects[1], projects[2]] as const;

export const film = {
  desktopHevc: '/film/voyage-1080-hevc10-b65e38dbad.mp4',
  desktop: '/film/voyage-1080-e93076f207.mp4',
  mobile: '/film/voyage-720-2d1ab8dc09.mp4',
  portraitHevc: '/film/voyage-portrait-480-hevc10-d9b56d1745.mp4',
  portrait: '/film/voyage-portrait-480-1436c8157f.mp4',
};

export const portraitFilmQuery = '(orientation: portrait)';
