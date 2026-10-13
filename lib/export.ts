import type { SavedResponse } from "./contracts";
export const EXPORT_HEADERS=["Response ID","Answer","Chosen date","Chosen time","Timezone","Preferences","Message","Submitted at (UTC)","Configuration version"];
export function safeSpreadsheetText(value:string){return /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;}
export function responseCells(response:SavedResponse):string[]{return [response.id,response.answer,response.chosenDate||"",response.chosenTime||"",response.timezone,response.selections.map(s=>`${s.questionLabel}: ${s.options.map(o=>o.label).join("; ")}`).join(" | "),response.message,response.submittedAt,String(response.configVersion)].map(safeSpreadsheetText);}
export function csv(records:SavedResponse[]){return "\uFEFF"+[EXPORT_HEADERS,...records.map(responseCells)].map(row=>row.map(cell=>`"${cell.replaceAll('"','""')}"`).join(",")).join("\r\n");}
