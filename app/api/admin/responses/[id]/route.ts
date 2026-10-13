import { z } from "zod";
import { admin } from "@/lib/server/admin";
import { dbCheck,HttpError,json,originCheck } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){try{originCheck(request);const {client,invitationId,user}=await admin();await rateLimit(request,"delete",30,900,user.id);const id=z.string().uuid().parse((await context.params).id);const {data,error}=await client.from("responses").delete().eq("id",id).eq("invitation_id",invitationId).select("id");dbCheck(error);if(!data?.length)throw new HttpError(404,"This response was not found.");return json({ok:true});}catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);if(e instanceof z.ZodError)return json({error:"Invalid response ID."},422);return json({error:"The response could not be deleted."},500);}}
