import "server-only";
import { createHmac } from "node:crypto";
import { serviceClient } from "./supabase";
import { env } from "./env";
import { HttpError } from "./http";
export async function rateLimit(request:Request,scope:string,maximum=20,seconds=900,identity?:string) {
  // Vercel overwrites x-vercel-forwarded-for. Other hosting must supply a trusted edge value;
  // the fallback is one shared bucket rather than trusting attacker-supplied forwarded IPs.
  const network=process.env.VERCEL ? (request.headers.get("x-vercel-forwarded-for")?.split(",")[0]||"unknown") : "shared-local";
  const key=createHmac("sha256",env("INVITATION_SESSION_SECRET")).update(`${scope}:${identity||network}`).digest("hex");
  const {data,error}=await serviceClient().rpc("consume_rate_limit",{p_key:key,p_limit:maximum,p_seconds:seconds});
  if(error)throw new HttpError(503,"Please try again shortly.");
  if(!data)throw new HttpError(429,"Too many requests. Please wait a little before trying again.");
}
