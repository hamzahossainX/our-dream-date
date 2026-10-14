import type { SavedResponse } from "./contracts";

// Public sample values, never a Supabase account or an authorization credential.
export const DEMO_LOGIN = { email: "demo@little-invitation.example", password: "ExploreTheDemo!" };
export function isDemoLogin(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_LOGIN.email && password === DEMO_LOGIN.password;
}
export function demoResponses(): SavedResponse[] {
  return [];
}
