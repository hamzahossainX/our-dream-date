import ExcelJS from "exceljs";
import { admin } from "@/lib/server/admin";
import { HttpError,route } from "@/lib/server/http";
import { allResponses,filterResponses } from "@/lib/server/responses";
import { csv,EXPORT_HEADERS,responseCells } from "@/lib/export";
import { rateLimit } from "@/lib/server/rate-limit";
export const runtime="nodejs";
export const GET=route(async(request)=>{const {client,invitationId,user}=await admin();await rateLimit(request,"export",20,3600,user.id);const params=new URL(request.url).searchParams;const format=params.get("format")||"csv";if(!["csv","xlsx"].includes(format))throw new HttpError(422,"Choose CSV or Excel format.");const records=filterResponses(await allResponses(client,invitationId),params);let content:BodyInit,type:string;if(format==="csv"){content=csv(records);type="text/csv; charset=utf-8";}else{const book=new ExcelJS.Workbook();const sheet=book.addWorksheet("Invitation responses");sheet.addRow(EXPORT_HEADERS);records.forEach(record=>sheet.addRow(responseCells(record)));sheet.getRow(1).font={bold:true};sheet.columns.forEach((column,i)=>{column.width=i===6?60:24;});sheet.views=[{state:"frozen",ySplit:1}];content=new Uint8Array(await book.xlsx.writeBuffer());type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";}return new Response(content,{headers:{"Content-Type":type,"Content-Disposition":`attachment; filename="invitation-responses.${format}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});});
