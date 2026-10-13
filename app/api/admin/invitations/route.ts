import { randomBytes } from "node:crypto";
import { admin } from "@/lib/server/admin";
import { env } from "@/lib/server/env";
import { dbCheck,json,originCheck,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { hash } from "@/lib/server/session";
export const POST=route(async(request)=>{originCheck(request);const {client,invitationId,user}=await admin();await rateLimit(request,"create-link",20,3600,user.id);const token=randomBytes(32).toString("base64url");const expiresAt=new Date(Date.now()+90*86400000).toISOString();const {error}=await client.from("recipient_invites").insert({invitation_id:invitationId,token_hash:hash(token),expires_at:expiresAt});dbCheck(error);return json({url:`${new URL(env("APP_URL")).origin}/#invite=${token}`,expiresAt},201);});
