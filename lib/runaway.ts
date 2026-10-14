export interface Point { x: number; y: number }
export interface Rectangle { left: number; top: number; width: number; height: number }

/** Choose an on-screen resting place away from the pointer and other controls. */
export function runawayPosition(
  viewport: { width: number; height: number },
  size: { width: number; height: number },
  pointer: Point,
  exclusions: Rectangle[],
  previous?: Point,
  variation = 0,
): Point | null {
  const marginX = Math.min(20, Math.max(0, (viewport.width - size.width) / 2));
  const marginY = Math.min(20, Math.max(0, (viewport.height - size.height) / 2));
  const maxX = Math.max(marginX, viewport.width - size.width - marginX);
  const maxY = Math.max(marginY, viewport.height - size.height - marginY);
  const candidates: { point: Point; score: number }[] = [];
  for (let row = 0; row < 7; row++) for (let column = 0; column < 7; column++) {
    const point = { x: marginX + (maxX - marginX) * column / 6, y: marginY + (maxY - marginY) * row / 6 };
    const overlaps = exclusions.some(rect => point.x < rect.left + rect.width + 18 && point.x + size.width > rect.left - 18 && point.y < rect.top + rect.height + 18 && point.y + size.height > rect.top - 18);
    const pointerInside = pointer.x > point.x - 65 && pointer.x < point.x + size.width + 65 && pointer.y > point.y - 65 && pointer.y < point.y + size.height + 65;
    if (overlaps || pointerInside) continue;
    const distance = Math.hypot(point.x + size.width / 2 - pointer.x, point.y + size.height / 2 - pointer.y);
    const travel = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0;
    const score = distance + travel * .25;
    candidates.push({ point, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  const count = Math.min(10, candidates.length);
  if (!count) return null;
  const index = Math.floor(Math.min(.999, Math.max(0, variation)) * count);
  return candidates[index].point;
}
