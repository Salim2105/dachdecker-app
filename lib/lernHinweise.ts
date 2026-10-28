export const LERN_KATEGORIEN=["einheiten","formel","rechenweg","begriffe","leseverstehen","englisch","fachwissen","ablauf","schichten","wasserweg","befund"] as const;
export type LernKategorie=typeof LERN_KATEGORIEN[number];
export interface LernHinweis {kategorie:LernKategorie;lernzielId:string;route:string;thema:string;richtig:boolean;hinweis:string}
export function istLernRoute(v:unknown):v is string{return typeof v==="string"&&(v==="/grundlagen/mathe?ansicht=pruefungsaufgaben"||/^\/(?:lernen(?:\/[a-zA-Z0-9_-]+)?|grundlagen\/mathe|sprache\/(?:deutsch|englisch)|lernhilfe|projekte|bildtraining)(?:#[a-zA-Z0-9_-]+)?$/.test(v));}
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
export function istLernHinweis(v:unknown):v is LernHinweis{return obj(v)&&typeof v.kategorie==="string"&&(LERN_KATEGORIEN as readonly string[]).includes(v.kategorie)&&istLernRoute(v.route)&&[v.lernzielId,v.thema,v.hinweis].every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=1200)&&typeof v.richtig==="boolean";}
