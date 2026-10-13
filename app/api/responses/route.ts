import { createHash } from "node:crypto";
import { configSchema,submissionSchema,validateSubmission } from "@/lib/validation";
import { configured,dbCheck,HttpError,json,originCheck,readJson,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { authorizedRecipient } from "@/lib/server/session";
import { serviceClient } from "@/lib/server/supabase";
export const POST=route(async(request)=>{configured();originCheck(request);const {session}=await authorizedRecipient();await rateLimit(request,"submit",20,900,session.recipientId);const raw=submissionSchema.parse(await readJson(request));if(raw.idempotencyKey!==session.key)throw new HttpError(409,"Reload the invitation before submitting again.","INVALID_KEY");const client=serviceClient();const {data:inv,error}=await client.from("invitations").select("config").eq("id",session.invitationId).single();dbCheck(error);const config=configSchema.parse(inv!.config);
 // Canonical ordered content makes identical retries from another device match.
 const canonical={answer:raw.answer,chosenDate:raw.chosenDate,timeSlotId:raw.timeSlotId,selections:Object.fromEntries(Object.entries(raw.selections).sort(([a],[b])=>a.localeCompare(b)).map(([key,values])=>[key,[...values].sort()])),message:raw.message,configVersion:raw.configVersion};
 const contentHash=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 const {data:existing,error:existingError}=await client.from("responses").select("snapshot,content_hash").eq("recipient_id",session.recipientId).maybeSingle();dbCheck(existingError);
 if(existing){if(existing.content_hash!==contentHash)throw new HttpError(409,"A response has already been saved for this invitation.","ALREADY_SUBMITTED");return json({response:existing.snapshot});}
 if(raw.configVersion!==config.version)throw new HttpError(409,"This invitation has changed. Reload and review your choices.","CONFIG_CHANGED");
 const valid=validateSubmission(raw,config);
 const {data,error:saveError}=await client.rpc("save_invitation_response",{p_recipient:session.recipientId,p_invitation:session.invitationId,p_version:config.version,p_key:session.key,p_hash:contentHash,p_answer:valid.input.answer,p_date:valid.input.chosenDate,p_time:valid.chosenTime,p_message:valid.input.message,p_selections:valid.selections});
 if(saveError){if(saveError.message.includes("CONFIG_CHANGED"))throw new HttpError(409,"The invitation changed. Reload and review it.","CONFIG_CHANGED");if(saveError.message.includes("ALREADY_SUBMITTED"))throw new HttpError(409,"A response has already been saved.","ALREADY_SUBMITTED");if(saveError.message.includes("CLOSED"))throw new HttpError(410,"This invitation is closed.","CLOSED");if(saveError.message.includes("INVALID_RECIPIENT"))throw new HttpError(401,"This invitation is no longer available.");throw new HttpError(503,"Your response could not be saved. Please retry.");}return json({response:data});});
