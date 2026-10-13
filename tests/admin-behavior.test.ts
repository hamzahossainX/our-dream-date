import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { filterResponses, metrics } from "../lib/server/responses";
import type { SavedResponse } from "../lib/contracts";

const accepted: SavedResponse = { id: "accepted-id", invitationId: "gift", answer: "yes", chosenDate: "2026-11-01", chosenTime: "19:00", timezone: "Asia/Dhaka", selections: [{ questionId: "activities", questionLabel: "Our plans", options: [{ id: "dinner", label: "Dinner for two" }] }], message: "A little HELLO", submittedAt: "2026-10-13T23:00:00Z", configVersion: 1 };
const declined: SavedResponse = { ...accepted, id: "declined-id", answer: "no", chosenDate: null, chosenTime: null, selections: [], message: "Another day", submittedAt: "2026-10-14T00:00:00Z" };

describe("admin response behavior", () => {
  it("combines search, answer, submission date, invitation date and activity filters", () => {
    const params = new URLSearchParams("q=hello&answer=yes&from=2026-10-13&to=2026-10-13&date=2026-11-01&activity=dinner");
    expect(filterResponses([accepted, declined], params)).toEqual([accepted]);
    params.set("activity", "movie");
    expect(filterResponses([accepted, declined], params)).toEqual([]);
  });
  it("searches IDs and preserves UTC submission boundaries separately from chosen date", () => {
    expect(filterResponses([accepted, declined], new URLSearchParams("q=DECLINED-ID"))).toEqual([declined]);
    expect(filterResponses([accepted, declined], new URLSearchParams("from=2026-10-14"))).toEqual([declined]);
    expect(filterResponses([accepted, declined], new URLSearchParams("date=2026-11-01"))).toEqual([accepted]);
  });
  it("computes metrics from real complete records including empty and single-response states", () => {
    expect(metrics([])).toEqual({ total: 0, accepted: 0, declined: 0, activities: [], days: [], times: [] });
    expect(metrics([declined])).toEqual({ total: 1, accepted: 0, declined: 1, activities: [], days: [{ date: "2026-10-14", count: 1 }], times: [] });
    expect(metrics([accepted, declined])).toEqual({ total: 2, accepted: 1, declined: 1, activities: [{ label: "Dinner for two", count: 1 }], days: [{ date: "2026-10-13", count: 1 }, { date: "2026-10-14", count: 1 }], times: [{ label: "19:00", count: 1 }] });
  });
  it("retains submitted labels when current configuration labels differ", () => {
    const records = [{ ...accepted, selections: [{ ...accepted.selections[0], options: [{ id: "dinner", label: "Historic dinner" }] }] }];
    expect(metrics(records).activities).toEqual([{ label: "Historic dinner", count: 1 }]);
    expect(filterResponses(records, new URLSearchParams("activity=dinner"))).toEqual(records);
  });
});
