import "server-only";
import { env } from "./env";
import { configured, HttpError } from "./http";
import { userClient } from "./supabase";
export async function admin(){configured();const client=await userClient();const {data:{user},error}=await client.auth.getUser();if(error||!user)throw new HttpError(401,"Please sign in to continue.");const {data:membership,error:roleError}=await client.from("admin_memberships").select("invitation_id").eq("user_id",user.id).eq("invitation_id",env("INVITATION_ID")).maybeSingle();if(roleError||!membership)throw new HttpError(403,"This account does not have invitation access.");return {client,user,invitationId:membership.invitation_id as string};}
