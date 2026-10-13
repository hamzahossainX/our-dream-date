import { configured,json,originCheck,route } from "@/lib/server/http";
import { userClient } from "@/lib/server/supabase";
export const POST=route(async(request)=>{configured();originCheck(request);const client=await userClient();await client.auth.signOut();return json({ok:true});});
