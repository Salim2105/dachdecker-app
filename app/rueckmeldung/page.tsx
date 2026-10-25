import { Rueckmeldung } from "@/components/feedback/Rueckmeldung";
import { Suspense } from "react";

export default function RueckmeldungPage() { return <Suspense fallback={<p>Deine Rückmeldung wird geöffnet …</p>}><Rueckmeldung /></Suspense>; }
