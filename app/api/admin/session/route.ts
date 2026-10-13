import { isConfigured } from "@/lib/server/env";
import { admin } from "@/lib/server/admin";
import { HttpError,json,route } from "@/lib/server/http";
export const GET=route(async()=>{if(!isConfigured())return json({configured:false,authenticated:false});try{const {user}=await admin();return json({configured:true,authenticated:true,email:user.email});}catch(e){if(e instanceof HttpError&&(e.status===401||e.status===403))return json({configured:true,authenticated:false});throw e;}});
