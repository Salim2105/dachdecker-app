import { beforeEach,describe,expect,it } from "vitest";
import { createExamAttempt,emptyExamAnswer,finishExam,parseExamAttempt,saveExam,loadExamHistory,syncExamReviews } from "@/lib/exam";
import { getPruefungsteile } from "@/lib/pruefung";
import { appStorage } from "@/lib/lernSpeicher";
import { loadReviewRecords,reviewKey } from "@/lib/review";
import { ladeFortschritt } from "@/lib/progress";

beforeEach(()=>localStorage.clear());
describe("Prüfung und gemeinsame Wiederholung",()=>{
  it("wertet erst nach Abgabe und jedes Aufgabenergebnis genau einmal",()=>{
    const a=createExamAttempt(getPruefungsteile()[0],false,Date.now()-1000,()=>.2);
    syncExamReviews(a);expect(loadReviewRecords()).toEqual({});
    const q=a.questions.find(q=>q.task.typ==="mc")!;
    if(q.task.typ!=="mc")throw new Error();
    a.answers[q.task.id]={...emptyExamAnswer(),choices:q.task.korrekt};
    const fertig=finishExam(a,Date.now());saveExam(appStorage,fertig);syncExamReviews(fertig);
    const key=reviewKey({quelle:"fachwissen",id:q.task.id,version:q.taskVersion,lernzielIds:q.lernzielIds!});
    expect(loadReviewRecords()[key].verlauf[0].bewertung).toBe("richtig");
    const wieder=parseExamAttempt(JSON.stringify(fertig))!;syncExamReviews(wieder);syncExamReviews(wieder);
    expect(loadReviewRecords()[key].verlauf).toHaveLength(1);
    expect(ladeFortschritt()[q.task.id].verlauf).toHaveLength(1);
    expect(Object.keys(loadReviewRecords())).toHaveLength(a.questions.length);
  });
  it("liest alte Ergebnisse ohne rückwirkend Erfolgsdaten zu erzeugen",()=>{
    const a=finishExam(createExamAttempt(getPruefungsteile()[0],false),Date.now());delete a.reviewVersion;
    saveExam(appStorage,a);syncExamReviews(a);loadExamHistory(appStorage);
    expect(loadReviewRecords()).toEqual({});expect(parseExamAttempt(JSON.stringify(a))).toEqual(a);
  });
});
