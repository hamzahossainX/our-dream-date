import { z } from "zod";
import { env } from "@/lib/server/env";
import { configured,json,originCheck,readJson,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { userClient } from "@/lib/server/supabase";
export const POST=route(async(request)=>{configured();originCheck(request);await rateLimit(request,"recover",5,3600);const {email}=z.object({email:z.string().email().max(254)}).strict().parse(await readJson(request,1024));await rateLimit(request,"recover-email",3,3600,email.toLowerCase());await (await userClient()).auth.resetPasswordForEmail(email,{redirectTo:`${new URL(env("APP_URL")).origin}/auth/callback`});return json({ok:true,message:"If that account exists, a recovery email will arrive shortly."});});
