import { responseFilters } from "@/lib/validation";
import { admin } from "@/lib/server/admin";
import { json,route } from "@/lib/server/http";
import { allResponses,filterResponses,metrics } from "@/lib/server/responses";
export const GET=route(async(request)=>{const {client,invitationId}=await admin();const params=new URL(request.url).searchParams;const all=await allResponses(client,invitationId);const filtered=filterResponses(all,params);const page=responseFilters(params).page;const pageSize=20;return json({responses:filtered.slice((page-1)*pageSize,page*pageSize),total:filtered.length,page,pageSize,metrics:metrics(all)});});
