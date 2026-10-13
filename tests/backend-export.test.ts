import { describe,it,expect } from "vitest";
import { csv,safeSpreadsheetText,responseCells } from "../lib/export";
import type { SavedResponse } from "../lib/contracts";
const response:SavedResponse={id:"receipt",invitationId:"gift",answer:"no",chosenDate:null,chosenTime:null,timezone:"Asia/Dhaka",selections:[],message:'  =HYPERLINK("evil")\nnext line, hello',submittedAt:"2026-10-13T00:00:00Z",configVersion:1};
describe("safe exports",()=>{
 it.each(["=SUM(1)"," +123","\t@command","\n-CMD","\u0000=1"])("neutralizes spreadsheet commands %s",value=>expect(safeSpreadsheetText(value)).toBe(`'${value}`));
 it("preserves ordinary romantic copy",()=>expect(safeSpreadsheetText("I would love to! ❤️")).toBe("I would love to! ❤️"));
 it("quotes CSV commas, multiline text and double quotes after formula protection",()=>{const output=csv([response]);expect(output).toContain('"\'  =HYPERLINK(""evil"")\nnext line, hello"');expect(output.charCodeAt(0)).toBe(0xfeff);expect(responseCells(response)[6].startsWith("'")).toBe(true);});
});
