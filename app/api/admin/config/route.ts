import { configSchema } from "@/lib/validation";
import { admin } from "@/lib/server/admin";
import { dbCheck,HttpError,json,originCheck,readJson,route } from "@/lib/server/http";
import { serviceClient } from "@/lib/server/supabase";
import { rateLimit } from "@/lib/server/rate-limit";
export const GET=route(async()=>{const {client,invitationId}=await admin();const {data,error}=await client.from("invitations").select("config").eq("id",invitationId).single();dbCheck(error);return json({config:data!.config});});
export const PUT=route(async(request)=>{originCheck(request);const {invitationId,user}=await admin();await rateLimit(request,"config",30,900,user.id);const body=await readJson(request);if(!body||typeof body!=="object"||!("config" in body))throw new HttpError(422,"Missing invitation configuration.");const config=configSchema.parse(body.config);const {data,error}=await serviceClient().rpc("publish_invitation_config",{p_invitation:invitationId,p_expected_version:config.version,p_config:config,p_actor:user.id});if(error){if(error.message.includes("CONFIG_CHANGED"))throw new HttpError(409,"Another edit was published. Reload before saving.","CONFIG_CHANGED");dbCheck(error);}return json({config:data});});
