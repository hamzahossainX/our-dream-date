import { z } from "zod";
import { env } from "@/lib/server/env";
import { configured,HttpError,json,originCheck,readJson,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { hash,setRecipientSession } from "@/lib/server/session";
import { serviceClient } from "@/lib/server/supabase";
export const POST=route(async(request)=>{configured();originCheck(request);await rateLimit(request,"open",30);const {token}=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This invitation link is incomplete. Ask Fahim for a fresh link.")}).strict().parse(await readJson(request,512));const {data,error}=await serviceClient().from("recipient_invites").select("id,invitation_id,expires_at,revoked_at").eq("token_hash",hash(token)).eq("invitation_id",env("INVITATION_ID")).maybeSingle();if(error)throw new HttpError(503,"This invitation could not be opened right now.");if(!data||data.revoked_at||(data.expires_at&&Date.parse(data.expires_at)<=Date.now()))throw new HttpError(401,"This private invitation link is invalid or expired.");await setRecipientSession(data.id,data.invitation_id,data.expires_at);return json({ok:true});});
