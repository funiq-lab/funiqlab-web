export const routeRadius = 43;
const routeStart = 32;
const routeEnd = 148;

export function dialPoint(radius: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return {x: 50 - radius * Math.sin(angle), y: 50 - radius * Math.cos(angle)};
}

export function dialArc(radius: number, start: number, end: number) {
  const from = dialPoint(radius, start);
  const to = dialPoint(radius, end);
  return `M${from.x} ${from.y}A${radius} ${radius} 0 0 0 ${to.x} ${to.y}`;
}

export function routeAngle(progress: number) {
  return routeStart + (routeEnd - routeStart) * progress;
}

export function routePoint(progress: number) {
  return dialPoint(routeRadius, routeAngle(progress));
}

export function elapsedArc(progress: number) {
  return progress > 0 ? dialArc(routeRadius, routeStart, routeAngle(progress)) : '';
}
