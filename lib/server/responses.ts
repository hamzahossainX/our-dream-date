import "server-only";
import type { SavedResponse } from "../contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "./http";
export async function allResponses(client:SupabaseClient,invitationId:string):Promise<SavedResponse[]>{
  const records:SavedResponse[]=[];let from=0;
  while(true){const {data,error}=await client.from("responses").select("snapshot").eq("invitation_id",invitationId).order("submitted_at",{ascending:false}).range(from,from+499);if(error)throw new HttpError(500,"Responses could not be loaded.");records.push(...(data||[]).map(row=>row.snapshot as SavedResponse));if(!data||data.length<500)break;from+=500;}
  return records;
}
export { filterResponses, metrics } from "../response-stats";
