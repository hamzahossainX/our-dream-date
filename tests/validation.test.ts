import { describe,it,expect } from "vitest";
import { DEFAULT_CONFIG } from "../lib/defaults";
import { configSchema,localNow,responseFilters,slotInstant,validateSubmission } from "../lib/validation";
import type { SubmissionInput } from "../lib/contracts";
const now=new Date("2026-10-13T12:00:00Z"); // 18:00 Dhaka
const yes:SubmissionInput={answer:"yes",chosenDate:"2026-10-14",timeSlotId:"evening",selections:{activities:["dinner"]},message:"See you soon",configVersion:1,idempotencyKey:"c60d303d-328c-43b6-9488-16a573972622"};
const no:SubmissionInput={...yes,answer:"no",chosenDate:null,timeSlotId:null,selections:{},message:""};
describe("complete response boundaries",()=>{
 it("validates yes and saves server-owned labels, not client labels",()=>{const result=validateSubmission(yes,DEFAULT_CONFIG,now);expect(result.chosenTime).toBe("19:00");expect(result.selections[0].options).toEqual([{id:"dinner",label:"Dinner for two"}]);});
 it("allows an empty optional decline without requiring yes-only activities",()=>{expect(validateSubmission(no,DEFAULT_CONFIG,now).selections).toEqual([]);});
 it("requires decline-only questions and rejects yes-only selections",()=>{const config={...DEFAULT_CONFIG,questions:[{...DEFAULT_CONFIG.questions[0],appliesTo:"no" as const}]};expect(()=>validateSubmission(no,config,now)).toThrow();expect(validateSubmission({...no,selections:{activities:["dinner"]}},config,now).selections).toHaveLength(1);expect(()=>validateSubmission({...no,selections:yes.selections},DEFAULT_CONFIG,now)).toThrow();});
 it.each([{chosenDate:"2026-02-30"},{chosenDate:"2026-10-12"},{chosenDate:"2026-10-13",timeSlotId:"afternoon"},{timeSlotId:"unknown"},{selections:{activities:[]}},{selections:{activities:["dinner","dinner"]}},{selections:{activities:["unknown"]}},{selections:{invented:["dinner"]}},{configVersion:2},{message:"a".repeat(1001)}])("rejects invalid complete payload %j",patch=>{expect(()=>validateSubmission({...yes,...patch},DEFAULT_CONFIG,now)).toThrow();});
 it("compares dates in the invitation timezone, including midnight",()=>{expect(localNow("Asia/Dhaka",new Date("2026-10-13T19:00:00Z"))).toEqual({date:"2026-10-14",time:"01:00"});expect(()=>validateSubmission({...yes,chosenDate:"2026-10-13"},DEFAULT_CONFIG,new Date("2026-10-13T19:00:00Z"))).toThrow();});
 it("rejects stale config and dates outside an admin's availability",()=>{expect(()=>validateSubmission(yes,{...DEFAULT_CONFIG,minDate:"2026-10-15"},now)).toThrow();expect(()=>validateSubmission(yes,{...DEFAULT_CONFIG,maxDate:"2026-10-13"},now)).toThrow();});
 it("enforces configurable message limit",()=>{expect(()=>validateSubmission({...no,message:"hello"},{...DEFAULT_CONFIG,messageMaxLength:3},now)).toThrow();});
 it("rejects malformed admin publication (duplicate IDs, bad limits, timezone, date)",()=>{expect(configSchema.safeParse(DEFAULT_CONFIG).success).toBe(true);for(const patch of [{timezone:"Atlantis/Imaginary"},{minDate:"2026-02-30"},{minDate:"2026-11-01",maxDate:"2026-10-01"},{questions:[{...DEFAULT_CONFIG.questions[0],selectionMode:"single",maxSelections:4}]},{timeSlots:[DEFAULT_CONFIG.timeSlots[0],DEFAULT_CONFIG.timeSlots[0]]}])expect(configSchema.safeParse({...DEFAULT_CONFIG,...patch}).success).toBe(false);});
});

describe("admin filter boundaries",()=>{it("rejects malformed dates, reversed ranges and bad page values",()=>{for(const query of ["from=2026-02-30","from=2026-10-14&to=2026-10-13","page=0","page=1.1","page=NaN","answer=maybe"])expect(()=>responseFilters(new URLSearchParams(query))).toThrow();});it("accepts empty controls and defaults first page",()=>expect(responseFilters(new URLSearchParams("q=&answer=&from=&to=")).page).toBe(1));});

describe("timezone clock changes",()=>{it("rejects nonexistent and ambiguous daylight-saving slots",()=>{expect(()=>slotInstant("2027-03-14","02:30","America/New_York")).toThrow(/clock change/);expect(()=>slotInstant("2026-11-01","01:30","America/New_York")).toThrow(/clock change/);});it("resolves a regular Dhaka date unambiguously",()=>expect(slotInstant("2026-10-14","19:00","Asia/Dhaka").toISOString()).toBe("2026-10-14T13:00:00.000Z"));});
