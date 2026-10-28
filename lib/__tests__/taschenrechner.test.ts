import {describe,it,expect} from "vitest";
import {rechneAusdruck} from "@/lib/taschenrechner";
describe("Lösungsfreier Taschenrechner",()=>{
 it.each([["sqrt(4^2+3^2)",5],["2,5*4+10%",10.1],["sin(30)",.5],["asin(0.5)",30],["2^3^2",512],["-2^2",-4],["2^-2",.25],["(3+2)*4",20],["abs(-7)",7]])("rechnet %s ohne Fachformel",(text,wert)=>expect(rechneAusdruck(text as string)).toBeCloseTo(wert as number,10));
 it.each(["","1/0","sqrt(-1)","tan(90)","sin(30","4foo","globalThis.alert(1)","2(3+1)","1e200","unknown(2)"])("weist ungültigen Ausdruck %s ab",text=>expect(()=>rechneAusdruck(text)).toThrow());
});
