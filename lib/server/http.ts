import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ValidationError } from "../validation";
import { env, isConfigured } from "./env";
export class HttpError extends Error { constructor(public status:number,message:string,public code?:string){super(message);} }
export function configured() { if (!isConfigured()) throw new HttpError(503,"This invitation is not connected yet. Please try again after setup.","NOT_CONFIGURED"); }
export function originCheck(request: Request) {
  const origin=request.headers.get("origin");
  let expected:string;
  try { expected=new URL(env("APP_URL")).origin; } catch {throw new HttpError(503,"Application URL is not configured.");}
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403,"This request must come from this website.");
}
export async function readJson(request:Request,limit=32768):Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new HttpError(415,"Send JSON data.");
  const reader=request.body?.getReader(); if (!reader) throw new HttpError(400,"Missing request body.");
  let bytes=0; const chunks:Uint8Array[]=[];
  while(true){ const {value,done}=await reader.read(); if(done)break; bytes += value.length; if(bytes>limit){await reader.cancel();throw new HttpError(413,"This request is too large.");} chunks.push(value); }
  try {return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{throw new HttpError(400,"Invalid JSON.");}
}
export function json(value:unknown,status=200,headers:Record<string,string>={}) {return NextResponse.json(value,{status,headers:{"Cache-Control":"private, no-store",...headers}});}
export function route(handler:(request:Request)=>Promise<Response>) {return async(request:Request)=>{try{return await handler(request);}catch(e){if(e instanceof HttpError)return json({error:e.message,code:e.code},e.status);if(e instanceof ValidationError || e instanceof ZodError)return json({error:e instanceof ZodError ? e.issues[0]?.message : e.message},422); console.error("Request failed",{type:e instanceof Error ? e.name:"UnknownError"});return json({error:"Something went wrong. Please try again."},500);}};}
export function dbCheck(error: {message:string;code?:string}|null) {if(error) throw new HttpError(500,"The database operation could not be completed.");}
