export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function normalize(x, y) { const d = Math.hypot(x, y); return d ? { x: x / d, y: y / d } : { x: 0, y: 0 }; }
// Segment collision prevents fast projectiles from tunneling through small targets.
export function segmentHit(ax, ay, bx, by, target, radius) {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? clamp(((target.x - ax) * dx + (target.y - ay) * dy) / length, 0, 1) : 0;
  return Math.hypot(ax + dx * t - target.x, ay + dy * t - target.y) <= radius;
}
