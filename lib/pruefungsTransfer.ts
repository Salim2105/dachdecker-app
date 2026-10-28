import { FALL_THEMEN, erzeugePruefungsFall } from "@/lib/pruefungsFaelle";
import type { ProjektTransfer } from "@/lib/bauprojekte";
import type { ReviewRef } from "@/lib/review";

export const PRUEFUNGS_TRANSFER_ROUTE = "/grundlagen/mathe?ansicht=pruefungsaufgaben";
const PREFIX = "pruefungs-transfer-";
export function pruefungsTransferFamilie(id: string): string | null {
  if (!id.startsWith(PREFIX)) return null;
  const familie = id.slice(PREFIX.length);
  return FALL_THEMEN.some(f => f.id === familie) ? familie : null;
}
export function pruefungsTransferRef(fallId: string): ReviewRef {
  const id = `${PREFIX}${fallId}`;
  if (!pruefungsTransferFamilie(id)) throw new Error("Diese Transferfamilie ist nicht vorhanden.");
  return {quelle:"projekt",id,version:1,lernzielIds:[id]};
}
/** Adapter preserves the altered context, including every number, as a review snapshot. */
export function erzeugePruefungsTransfer(fallId: string, variante = 0): ProjektTransfer {
  const fall = erzeugePruefungsFall(fallId,variante),ref = pruefungsTransferRef(fallId);
  return {id:ref.id,projektId:fall.familie,version:fall.version,titel:`${fall.titel}: neuer Zusammenhang`,
    ...fall.transfer,lernzielIds:[...ref.lernzielIds],route:PRUEFUNGS_TRANSFER_ROUTE,sekunden:180,
    parameter:{...fall.parameter,variante:fall.variante}};
}
