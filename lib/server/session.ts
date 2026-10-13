import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import { HttpError } from "./http";
import { serviceClient } from "./supabase";
export const SESSION_COOKIE="fahim_invitation";
export type RecipientSession={recipientId:string;invitationId:string;key:string;expires:number};
export function hash(value:string){return createHash("sha256").update(value).digest("hex");}
export function contentHash(value:unknown){return hash(JSON.stringify(value));}
function signature(value:string){return createHmac("sha256",env("INVITATION_SESSION_SECRET")).update(value).digest("base64url");}
export async function setRecipientSession(recipientId:string,invitationId:string,expiresAt:string|null){
  const expires=Math.min(Date.now()+7*86400000, expiresAt ? new Date(expiresAt).getTime() : Infinity);
  const session:RecipientSession={recipientId,invitationId,key:randomUUID(),expires};
  const payload=Buffer.from(JSON.stringify(session)).toString("base64url");
  (await cookies()).set(SESSION_COOKIE,`${payload}.${signature(payload)}`,{httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"strict",path:"/",expires:new Date(expires)});
}
export async function recipientSession():Promise<RecipientSession|null>{
  const value=(await cookies()).get(SESSION_COOKIE)?.value; if(!value)return null;
  try{const [payload,sig]=value.split(".");const expected=signature(payload);if(!sig || sig.length!==expected.length || !timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const s=JSON.parse(Buffer.from(payload,"base64url").toString());
    if(typeof s.recipientId!=="string" || typeof s.invitationId!=="string" || typeof s.key!=="string" || typeof s.expires!=="number" || s.expires<Date.now() || s.invitationId!==env("INVITATION_ID"))return null;
    return s;
  }catch{return null;}
}
export async function authorizedRecipient(){const session=await recipientSession();if(!session)throw new HttpError(401,"Open your private invitation link to continue.");const {data,error}=await serviceClient().from("recipient_invites").select("id,invitation_id,expires_at,revoked_at,completed_at").eq("id",session.recipientId).eq("invitation_id",session.invitationId).single();if(error||!data||data.revoked_at||(data.expires_at&&Date.parse(data.expires_at)<=Date.now()))throw new HttpError(401,"This invitation link is no longer available.");return {session,recipient:data};}
