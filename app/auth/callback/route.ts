import { NextResponse } from "next/server";
import { env,isConfigured } from "@/lib/server/env";
import { userClient } from "@/lib/server/supabase";
export async function GET(request:Request){const app=new URL(isConfigured()?env("APP_URL"):request.url).origin;const code=new URL(request.url).searchParams.get("code");if(isConfigured()&&code){const {error}=await (await userClient()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(`${app}/admin/reset`);}return NextResponse.redirect(`${app}/admin/login?error=recovery`);}
