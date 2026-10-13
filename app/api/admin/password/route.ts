import { z } from "zod";
import { admin } from "@/lib/server/admin";
import { dbCheck,json,originCheck,readJson,route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
export const POST=route(async(request)=>{originCheck(request);const {client,user}=await admin();await rateLimit(request,"password",5,3600,user.id);const {password}=z.object({password:z.string().min(12).max(128)}).strict().parse(await readJson(request,1024));const {error}=await client.auth.updateUser({password});dbCheck(error);return json({ok:true});});
