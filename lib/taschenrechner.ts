/** Arithmetic only; angles in degrees. Never executes JavaScript or roofing formulas. */
export function rechneAusdruck(eingabe:string):number {
 const s=eingabe.replaceAll(",",".").replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replace(/\s/g,"").toLowerCase();
 if(!s||s.length>240)throw new Error("Gib einen Rechenausdruck mit höchstens 240 Zeichen ein.");
 let i=0,zaehler=0;
 function sicher(n:number){if(!Number.isFinite(n)||Math.abs(n)>1e100)throw new Error("Das Ergebnis ist außerhalb des Rechenbereichs.");return n;}
 function atom():number {
  if(++zaehler>180)throw new Error("Bitte den Ausdruck kürzen.");let v:number;
  if(s[i]==="("){i++;v=summe();if(s[i++]!==")")throw new Error("Eine schließende Klammer fehlt.");}
  else {const n=/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/.exec(s.slice(i));if(n){i+=n[0].length;v=Number(n[0]);}
   else if(s.slice(i,i+2)==="pi"){i+=2;v=Math.PI;}
   else {const name=/^[a-z]+/.exec(s.slice(i))?.[0];if(!name)throw new Error("Prüfe Zahlen und Rechenzeichen.");i+=name.length;if(s[i++]!=="(")throw new Error("Funktionen brauchen Klammern, zum Beispiel sin(30).");const x=summe();if(s[i++]!==")")throw new Error("Eine schließende Klammer fehlt.");const d=Math.PI/180;switch(name){case"sin":v=Math.sin(x*d);break;case"cos":v=Math.cos(x*d);break;case"tan":if(Math.abs(Math.cos(x*d))<1e-12)throw new Error("Tangens ist hier nicht definiert.");v=Math.tan(x*d);break;case"asin":v=Math.asin(x)/d;break;case"acos":v=Math.acos(x)/d;break;case"atan":v=Math.atan(x)/d;break;case"sqrt":v=Math.sqrt(x);break;case"abs":v=Math.abs(x);break;default:throw new Error("Erlaubt sind sin, cos, tan, asin, acos, atan, sqrt und abs.");}}}
  if(s[i]==="%"){i++;v/=100;}return sicher(v);
 }
 function potenz():number{const a=atom();if(s[i]==="^"){i++;return sicher(a**vorzeichen());}return a;}
 function vorzeichen():number{if(s[i]==="+"){i++;return vorzeichen();}if(s[i]==="-"){i++;return -vorzeichen();}return potenz();}
 function produkt():number{let v=vorzeichen();while(s[i]==="*"||s[i]==="/"){const op=s[i++],b=vorzeichen();if(op==="/"&&b===0)throw new Error("Durch null kannst du nicht teilen.");v=sicher(op==="*"?v*b:v/b);}return v;}
 function summe():number{let v=produkt();while(s[i]==="+"||s[i]==="-"){const op=s[i++],b=produkt();v=sicher(op==="+"?v+b:v-b);}return v;}
 const wert=summe();if(i!==s.length)throw new Error("Prüfe den Ausdruck. Zwischen Größen muss ein Rechenzeichen stehen.");return sicher(wert);
}
