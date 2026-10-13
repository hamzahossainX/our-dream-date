import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "./env";
export function serviceClient() { return createClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false,autoRefreshToken:false}}); }
export async function userClient() {
  const jar = await cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"),env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),{cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"lax",path:"/"},cookies:{getAll(){return jar.getAll();},setAll(values){values.forEach(({name,value,options})=>jar.set(name,value,options));}}});
}
