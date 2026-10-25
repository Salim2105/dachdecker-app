export interface NavigationEintrag { href:string; label:string; icon:string; katalog?:boolean }
export interface NavigationGruppe { id:string; label:string; eintraege:readonly NavigationEintrag[] }
export const NAV_GRUPPEN:readonly NavigationGruppe[]=[
 {id:"mein-lernen",label:"Mein Lernen",eintraege:[
  {href:"/",label:"Übersicht",icon:"M3 11l9-8 9 8M5 10v10h14V10"},
  {href:"/heute",label:"Tagesrunde",icon:"M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0113-3l2 2M4 17l2 2a8 8 0 0013-3"},
  {href:"/lernhilfe",label:"Gezielt weiterüben",icon:"M12 3a7 7 0 00-4 13v3h8v-3a7 7 0 00-4-13zM9 22h6M9 10h6"},
  {href:"/fortschritt",label:"Lernstand & Sicherungen",icon:"M4 20h16M6 16V9M12 16V4M18 16v-5"},
 ]},
 {id:"wissen",label:"Wissen & Fächer",eintraege:[
  {href:"/lernen",label:"Lernfelder",icon:"M4 5h16v14H4zM4 9h16M9 5v14"},
  {href:"/grundlagen/mathe",label:"Fachmathe",katalog:true,icon:"M5 3h14v18H5zM8 7h8M8 12h1M15 12h1M8 17h1M15 17h1"},
  {href:"/sprache/deutsch",label:"Deutsch fürs Handwerk",katalog:true,icon:"M4 5h16v12H9l-5 4zM8 9h8M8 13h5"},
  {href:"/sprache/englisch",label:"Baustellenenglisch",katalog:true,icon:"M3 4h18v14H9l-6 4zM7 8h10M7 12h7"},
  {href:"/fachbegriffe",label:"Fachbegriffe",icon:"M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zM12 5v15"},
 ]},
 {id:"praxis",label:"Üben & Praxis",eintraege:[
  {href:"/ueben",label:"Quiz & Aufgaben",icon:"M9 4H4v5h5zM9 15H4v5h5zM13 6h7M13 17h7"},
  {href:"/bildtraining",label:"Bildtraining",katalog:true,icon:"M3 4h18v16H3zM3 16l6-6 4 4 3-3 5 5M15 8h1"},
  {href:"/zeichnen",label:"Zeichnen",icon:"M14 5l5 5M3 21l5-1L21 7a3 3 0 00-4-4L4 16z"},
  {href:"/projekte",label:"Baustellenprojekte",katalog:true,icon:"M3 12l9-9 9 9M6 10v11h12V10M10 21v-7h4v7"},
  {href:"/praxis",label:"Praxisfälle",icon:"M4 7h16v14H4zM8 7V3h8v4M4 12h16M10 12v3h4v-3"},
 ]},
 {id:"pruefen",label:"Prüfung & Werkzeuge",eintraege:[
  {href:"/pruefung",label:"Prüfungen",icon:"M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"},
  {href:"/rechner",label:"Rechner",icon:"M5 3h14v18H5zM8 7h8M8 12h2M14 12h2M8 17h2M14 17h2"},
 ]},
];
export const WERKSTATT_NAV=NAV_GRUPPEN.flatMap(g=>g.eintraege);
export const SERVICE_NAV=[{href:"/rueckmeldung",label:"Rückmeldungen"},{href:"/erprobung",label:"Erprobungsbogen"}] as const;
export const MOBILE_NAV=[{href:"/",label:"Start"},{href:"/heute",label:"Heute"},{href:null,label:"Bereiche"},{href:"/fortschritt",label:"Lernstand"}] as const;
export const navigationsZiel=(e:NavigationEintrag)=>e.katalog?`${e.href}?ansicht=uebersicht`:e.href;
export function aktiverBereich(url:string):string|null{
 const path=url.split(/[?#]/)[0].replace(/\/+$/,"")||"/";
 if(/^\/lernen\/[^/]+\/ueben$/.test(path))return "/ueben";
 if(/^\/lernen\/[^/]+$/.test(path))return "/lernen";
 if(path==="/lernweg")return "/praxis";
 return [...WERKSTATT_NAV,...SERVICE_NAV].find(e=>e.href===path)?.href??null;
}
export function bereichsTitel(path:string):string{return [...WERKSTATT_NAV,...SERVICE_NAV].find(e=>e.href===aktiverBereich(path))?.label??"Lernwerkstatt";}
