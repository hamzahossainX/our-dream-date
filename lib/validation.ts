import { z } from "zod";
import type { InvitationConfig, SavedSelection, SubmissionInput } from "./contracts";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const d = new Date(`${value}T00:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value; }, "Invalid calendar date");
const copy = (max: number) => z.string().trim().min(1).max(max);
const option = z.object({ id, label: copy(100), emoji: z.string().max(16), description: z.string().max(200).optional() }).strict();
const question = z.object({ id, appliesTo:z.enum(["yes","no","both"]), label: copy(200), description: z.string().max(400).optional(), selectionMode: z.enum(["single", "multiple"]), required: z.boolean(), minSelections: z.number().int().min(0).max(20), maxSelections: z.number().int().min(1).max(20), options: z.array(option).min(1).max(20) }).strict().superRefine((q, ctx) => {
  if (q.minSelections > q.maxSelections || q.maxSelections > q.options.length || (q.selectionMode === "single" && q.maxSelections !== 1)) ctx.addIssue({ code: "custom", message: "Selection limits do not match options" });
  if (new Set(q.options.map(o => o.id)).size !== q.options.length) ctx.addIssue({ code:"custom", message:"Duplicate option IDs" });
});
export const configSchema = z.object({ version:z.number().int().positive(), messageMaxLength:z.number().int().min(0).max(5000), recipientName:copy(80), senderName:copy(80), title:copy(200), subtitle:copy(300), openingNote:copy(1500), closingMessage:copy(1500), timezone:z.string().max(64).refine(v => { try { new Intl.DateTimeFormat("en", {timeZone:v}); return true; } catch { return false; } }, "Invalid timezone"), minDate:date.nullable(), maxDate:date.nullable(), timeSlots:z.array(z.object({id,label:copy(100),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).strict()).min(1).max(24), questions:z.array(question).max(10), accent:z.enum(["rose","lavender","peach"]) }).strict().superRefine((c,ctx) => {
  if (c.minDate && c.maxDate && c.minDate > c.maxDate) ctx.addIssue({code:"custom", message:"End date must follow start date"});
  if (new Set(c.questions.map(q=>q.id)).size !== c.questions.length || new Set(c.timeSlots.map(s=>s.id)).size !== c.timeSlots.length) ctx.addIssue({code:"custom", message:"Question and time slot IDs must be unique"});
});
export const submissionSchema = z.object({ answer:z.enum(["yes","no"]), chosenDate:date.nullable(), timeSlotId:id.nullable(), selections:z.record(id,z.array(id).max(20)), message:z.string().trim().max(5000), configVersion:z.number().int().positive(), idempotencyKey:z.string().uuid() }).strict();
export class ValidationError extends Error {}
export function localNow(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:timezone, year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
  const read = (part: string) => parts.find(p=>p.type === part)?.value;
  return {date:`${read("year")}-${read("month")}-${read("day")}`, time:`${read("hour")}:${read("minute")}`};
}
// Resolve wall-clock slots against the configured timezone. A skipped or repeated
// daylight-saving hour is not a single valid appointment; require another slot.
export function slotInstant(date:string,time:string,timezone:string):Date {
  const desired=Date.parse(`${date}T${time}:00Z`);
  const candidates=new Set<number>();
  for(const delta of [-86400000,0,86400000]){
    const sampled=desired+delta;
    const local=localNow(timezone,new Date(sampled));
    const offset=Date.parse(`${local.date}T${local.time}:00Z`)-sampled;
    const candidate=desired-offset;
    const formatted=localNow(timezone,new Date(candidate));
    if(formatted.date===date&&formatted.time===time)candidates.add(candidate);
  }
  if(candidates.size!==1)throw new ValidationError("That time is affected by a clock change. Choose another time slot.");
  return new Date([...candidates][0]);
}
export function validateSubmission(raw: unknown, config: InvitationConfig, now = new Date()): {input:SubmissionInput; selections:SavedSelection[]; chosenTime:string|null} {
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message || "Invalid response");
  const input = parsed.data;
  if (input.configVersion !== config.version) throw new ValidationError("The invitation has changed. Please reload and review your choices.");
  if (input.message.length > config.messageMaxLength) throw new ValidationError(`Keep your note within ${config.messageMaxLength} characters.`);
  if (input.answer === "no" && (input.chosenDate !== null || input.timeSlotId !== null)) throw new ValidationError("A decline must not include date or time choices.");
  const slot = config.timeSlots.find(s=>s.id === input.timeSlotId);
  if (input.answer === "yes" && (!input.chosenDate || !slot)) throw new ValidationError("Choose an available date and time.");
  const current = localNow(config.timezone,now);
  if (input.answer === "yes" && input.chosenDate && slot && (input.chosenDate < current.date || (input.chosenDate === current.date && slot.time <= current.time) || (config.minDate && input.chosenDate < config.minDate) || (config.maxDate && input.chosenDate > config.maxDate))) throw new ValidationError("Choose a future date and time within the available dates.");
  if(input.answer === "yes" && input.chosenDate && slot && slotInstant(input.chosenDate,slot.time,config.timezone).getTime() <= now.getTime()) throw new ValidationError("Choose a future date and time.");
  if (Object.keys(input.selections).some(key=>!config.questions.some(q=>q.id === key))) throw new ValidationError("Unknown activity question.");
  const applicable=config.questions.filter(q=>q.appliesTo === "both" || q.appliesTo === input.answer);
  if (Object.keys(input.selections).some(key=>!applicable.some(q=>q.id === key))) throw new ValidationError("That question does not apply to this answer.");
  const selections: SavedSelection[] = applicable.map(q=> {
    const selected = input.selections[q.id] || [];
    if (new Set(selected).size !== selected.length) throw new ValidationError("Duplicate activity selection.");
    const minimum = q.required ? Math.max(1,q.minSelections) : selected.length ? q.minSelections : 0;
    if (selected.length < minimum || selected.length > q.maxSelections || (q.selectionMode === "single" && selected.length > 1)) throw new ValidationError(`Check your choices for ${q.label}.`);
    const options = selected.map(value => { const opt=q.options.find(o=>o.id === value); if (!opt) throw new ValidationError("An activity is no longer available."); return {id:opt.id,label:opt.label}; });
    return {questionId:q.id,questionLabel:q.label,options};
  });
  return {input,selections,chosenTime:input.answer === "yes" ? slot!.time : null};
}
export const responseFilterSchema=z.object({q:z.string().max(200).optional(),answer:z.enum(["yes","no"]).optional(),from:date.optional(),to:date.optional(),date:date.optional(),activity:id.optional(),page:z.coerce.number().int().min(1).max(100000).default(1)}).superRefine((v,ctx)=>{if(v.from&&v.to&&v.from>v.to)ctx.addIssue({code:"custom",message:"End date must follow start date."});});
export function responseFilters(params:URLSearchParams){return responseFilterSchema.parse(Object.fromEntries(["q","answer","from","to","date","activity","page"].map(key=>[key,params.get(key)||undefined])));}
