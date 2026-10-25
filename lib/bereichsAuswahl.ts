/** Menu catalogues never erase the saved selection or an exercise draft.
 * A valid unit deep link always wins, including when a catalogue flag is set. */
export function bereichsAuswahl(ids:readonly string[],gespeichert:string|null,adresse?:{hash:string;search:string}):string{
 const ort=adresse??(typeof window!=="undefined"?window.location:{hash:"",search:""});
 const id=ort.hash.slice(1);
 if(id)return ids.includes(id)?id:"";
 if(new URLSearchParams(ort.search).get("ansicht")==="uebersicht")return "";
 return gespeichert&&ids.includes(gespeichert)?gespeichert:"";
}
