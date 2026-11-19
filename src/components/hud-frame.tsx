import {dialArc, dialPoint, routeAngle, routeRadius} from '@/lib/route-dial';

const rimSegments = [[12, 30], [33, 56], [69, 83], [97, 111], [124, 147], [150, 168]];

function ProjectedLogo({id}: {id: string}) {
  return <svg className="hud-logo" viewBox="0 0 120 120">
    <defs>
      <mask id={`${id}-brand`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120" style={{maskType:'alpha'}}>
        <image href="/logo.svg" width="120" height="120"/>
      </mask>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".35" y2="1">
        <stop stopColor="#fafafa"/><stop offset=".25" stopColor="#aaa"/>
        <stop offset=".48" stopColor="#515151"/><stop offset=".53" stopColor="#ececec"/>
        <stop offset=".76" stopColor="#888"/><stop offset="1" stopColor="#ccc"/>
      </linearGradient>
      <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1="4" y1="26" x2="108" y2="86">
        <stop stopColor="#fff" stopOpacity="0"/>
        <stop offset=".22" stopColor="#fff" stopOpacity=".08"/>
        <stop offset=".34" stopColor="#fff" stopOpacity=".72"/>
        <stop offset=".40" stopColor="#fff" stopOpacity=".35"/>
        <stop offset=".58" stopColor="#fff" stopOpacity="0"/>
        <stop offset=".82" stopColor="#111" stopOpacity=".25"/>
        <stop offset="1" stopColor="#111" stopOpacity="0"/>
      </linearGradient>
      <pattern id={`${id}-grain`} width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height=".55" fill="#171717" opacity=".45"/>
      </pattern>
    </defs>
    <g className="hud-logo-turn">
      <g mask={`url(#${id}-brand)`} transform="translate(0 1.4)">
        <rect width="120" height="120" fill="#505050"/>
      </g>
      <g mask={`url(#${id}-brand)`}>
        <rect width="120" height="120" fill={`url(#${id}-metal)`}/>
        <g className="hud-logo-sheen">
          <rect x="-30" y="-30" width="180" height="180" fill={`url(#${id}-sheen)`}/>
        </g>
        <rect width="120" height="120" fill={`url(#${id}-grain)`}/>
      </g>
    </g>
  </svg>;
}

export function HudFrame({side}: {side: 'left' | 'right'}) {
  const id = `hud-${side}`;
  return <div className="hud-frame" data-side={side} aria-hidden="true">
    <div className="hud-glass"/>
    <svg className="hud-rings" viewBox="0 0 50 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-rim-light`} x1="0" y1="0" x2=".15" y2="1">
          <stop stopColor="#666"/><stop offset=".24" stopColor="#e1e1e1"/>
          <stop offset=".42" stopColor="#666"/><stop offset=".68" stopColor="#bcbcbc"/>
          <stop offset="1" stopColor="#515151"/>
        </linearGradient>
        <radialGradient id={`${id}-reflection`}>
          <stop stopColor="#fff" stopOpacity=".17"/><stop offset=".4" stopColor="#fff" stopOpacity=".07"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <g className="hud-fan">
        <ellipse cx="7" cy="50" rx="4" ry="6" fill={`url(#${id}-reflection)`} stroke="none"/>
      </g>
      <path className="hud-outline" stroke={`url(#${id}-rim-light)`} d={dialArc(49.5,0,180)}/>
      <path className="hud-recess" d={dialArc(48.85,3,177)}/>
      <path className="hud-inner" d={[38,27,18].map(radius => dialArc(radius,0,180)).join(' ')}/>
      <path className="hud-track-line" d={dialArc(routeRadius,0,180)}/>
      {rimSegments.map(([start,end]) => <path key={start} className="hud-rim-segment" pathLength="1"
        d={dialArc(48.1,start,end)}/>)}
      {Array.from({length:31}, (_, second) => {
        const angle = routeAngle(second / 30);
        const major = second % 5 === 0;
        const outer = dialPoint(47,angle);
        const inner = dialPoint(major ? 45.2 : 46.15,angle);
        return <line key={second} className={major ? 'hud-tick major' : 'hud-tick'}
          x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}/>;
      })}
    </svg>
    <ProjectedLogo id={id}/>
  </div>;
}
