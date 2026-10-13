// Run with: npm run bootstrap (Node 22+, loads .env.local)
import { createClient } from "@supabase/supabase-js";
import { createHash,randomBytes } from "node:crypto";
import { DEFAULT_CONFIG } from "../lib/defaults";
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) process.loadEnvFile(".env.local");
function env(name:string){const value=process.env[name];if(!value)throw new Error(`Set ${name} before running bootstrap.`);return value;}
const client=createClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false,autoRefreshToken:false}});
const invitationId=env("INVITATION_ID"),userId=env("ADMIN_USER_ID");
const {data:user,error:userError}=await client.auth.admin.getUserById(userId);if(userError||!user.user)throw new Error("ADMIN_USER_ID must belong to an existing Supabase Auth user.");
const {data:existing,error:findError}=await client.from("invitations").select("id").eq("id",invitationId).maybeSingle();if(findError)throw new Error("Apply the schema migration first.");
if(!existing){const {error}=await client.from("invitations").insert({id:invitationId,owner_id:userId,config:DEFAULT_CONFIG,version:1});if(error)throw new Error("Invitation creation failed.");}
const {error:memberError}=await client.from("admin_memberships").upsert({user_id:userId,invitation_id:invitationId});if(memberError)throw new Error("Admin membership creation failed.");
const {data:current,error:configError}=await client.from("invitations").select("version,config").eq("id",invitationId).single();if(configError)throw new Error("Invitation lookup failed.");
const {error:versionError}=await client.from("invitation_versions").upsert({invitation_id:invitationId,version:current.version,config:current.config},{onConflict:"invitation_id,version",ignoreDuplicates:true});if(versionError)throw new Error("Version snapshot creation failed.");
const token=randomBytes(32).toString("base64url"),expiresAt=new Date(Date.now()+90*86400000).toISOString();
const {error:linkError}=await client.from("recipient_invites").insert({invitation_id:invitationId,token_hash:createHash("sha256").update(token).digest("hex"),expires_at:expiresAt});if(linkError)throw new Error("Link creation failed.");
console.log("Bootstrap complete. Keep this private recipient URL safe; the original token is not stored:");
console.log(`${new URL(env("APP_URL")).origin}/#invite=${token}`);
