import { describe, expect, it } from "vitest";
import { runawayPosition } from "../lib/runaway";

describe("playful No placement", () => {
  it("stays inside the visible viewport and leaves Yes unobstructed", () => {
    const yes = { left: 60, top: 500, width: 230, height: 48 };
    const position = runawayPosition({ width: 1440, height: 900 }, { width: 160, height: 48 }, { x: 330, y: 520 }, [yes]);
    expect(position).not.toBeNull();
    expect(position!.x).toBeGreaterThanOrEqual(0);
    expect(position!.x + 160).toBeLessThanOrEqual(1440);
    expect(position!.y + 48).toBeLessThanOrEqual(900);
    expect(position!.x > yes.left + yes.width || position!.x + 160 < yes.left || position!.y > yes.top + yes.height || position!.y + 48 < yes.top).toBe(true);
  });
  it("moves away again when the mouse reaches its new resting place", () => {
    const first = runawayPosition({ width: 1200, height: 800 }, { width: 160, height: 48 }, { x: 300, y: 600 }, [])!;
    const next = runawayPosition({ width: 1200, height: 800 }, { width: 160, height: 48 }, { x: first.x + 80, y: first.y + 24 }, [], first)!;
    expect(Math.hypot(next.x - first.x, next.y - first.y)).toBeGreaterThan(100);
  });
  it("fits smaller viewports without creating off-screen controls", () => {
    const position = runawayPosition({ width: 375, height: 300 }, { width: 160, height: 48 }, { x: 50, y: 150 }, [])!;
    expect(position.x + 160).toBeLessThanOrEqual(375);
    expect(position.y + 48).toBeLessThanOrEqual(300);
  });
  it("does not cover other controls when there is no safe space", () => {
    expect(runawayPosition({ width: 200, height: 100 }, { width: 160, height: 48 }, { x: 50, y: 50 }, [{ left: 0, top: 0, width: 200, height: 100 }])).toBeNull();
  });
});
