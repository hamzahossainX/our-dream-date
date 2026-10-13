import { DEFAULT_CONFIG } from "@/lib/defaults";
import { env,isConfigured } from "@/lib/server/env";
import { authorizedRecipient } from "@/lib/server/session";
import { serviceClient } from "@/lib/server/supabase";
import { dbCheck,HttpError,json,route } from "@/lib/server/http";
import type { InvitationConfig,SavedResponse } from "@/lib/contracts";
export const dynamic="force-dynamic";
export const GET=route(async()=>{
 if(!isConfigured())return json({config:DEFAULT_CONFIG,configured:false,authorized:false,response:null});
 let auth;try{auth=await authorizedRecipient();}catch(e){if(e instanceof HttpError && e.status ===401)return json({config:DEFAULT_CONFIG,configured:true,authorized:false,response:null});throw e;}
 const client=serviceClient();
 const {data:inv,error}=await client.from("invitations").select("config").eq("id",env("INVITATION_ID")).single();dbCheck(error);
 const {data:record,error:responseError}=await client.from("responses").select("snapshot").eq("recipient_id",auth.session.recipientId).maybeSingle();dbCheck(responseError);
 if(auth.recipient.completed_at&&!record)throw new HttpError(410,"This invitation is closed. Please contact Fahim.","CLOSED");
 return json({config:inv!.config as InvitationConfig,configured:true,authorized:true,response:record?.snapshot as SavedResponse||null},200,{"X-Idempotency-Key":auth.session.key});
});
