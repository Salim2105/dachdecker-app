import { LernLink } from "@/components/LernLink";
export function PraxisWege({begleitet=false}:{begleitet?:boolean}){
 return <section className="praxis-wege" aria-label="Zwei Wege für Praxisfälle"><p>Sechs kurze Grundlagenfälle. Wähle, ob du zuerst eine Erklärung lesen oder direkt selbst lösen möchtest. Jeder Weg behält seine eigenen Eingaben.</p><nav aria-label="Bearbeitungsweg für Praxisfälle"><LernLink href="/lernweg" aria-current={begleitet?"page":undefined}>Mit Erklärung lernen</LernLink><LernLink href="/praxis" aria-current={!begleitet?"page":undefined}>Selbst lösen</LernLink></nav></section>;
}
