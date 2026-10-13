import { z } from "zod";
import { admin } from "@/lib/server/admin";
import { configured,HttpError,json,originCheck,readJson,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { userClient } from "@/lib/server/supabase";
export const POST=route(async(request)=>{configured();originCheck(request);await rateLimit(request,"login",10);const input=z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)}).strict().parse(await readJson(request,2048));await rateLimit(request,"login-email",10,900,input.email.toLowerCase());const client=await userClient();const {error}=await client.auth.signInWithPassword(input);if(error)throw new HttpError(401,"Email or password is incorrect.");try{await admin();}catch{await client.auth.signOut();throw new HttpError(403,"This account does not have invitation access.");}return json({ok:true});});
