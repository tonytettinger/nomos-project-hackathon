import { useEffect, useMemo, useState } from "react";
import { fetchCases } from "./api/client";
import { AppHeader } from "./components/AppHeader";
import { CallForm } from "./components/CallForm";
import { CallStatusIndicator } from "./components/CallStatusIndicator";
import { CaseSummary } from "./components/CaseSummary";
import { StructuredResultAccordion } from "./components/StructuredResultAccordion";
import { TranscriptAccordion } from "./components/TranscriptAccordion";
import { useConversationAnalysis } from "./features/analysis/useConversationAnalysis";
import { useBrowserVoiceSession } from "./features/voice/useBrowserVoiceSession";
import type { CallCase } from "../shared/callSchema";

export default function App() {
  const [cases, setCases] = useState<CallCase[]>([]);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const voiceSession = useBrowserVoiceSession();
  const analysis = useConversationAnalysis();

  useEffect(() => {
    const controller = new AbortController();
    fetchCases(controller.signal)
      .then((nextCases) => {
        setCases(nextCases);
        setSelectedCaseId((current) => current || nextCases[0]?.id || "");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCasesError(error instanceof Error ? error.message : "Unable to load cases");
      });
    return () => controller.abort();
  }, []);

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );
  const canSubmit = Boolean(selectedCase && !voiceSession.isActive);

  useEffect(() => {
    if (
      voiceSession.phase === "done" &&
      voiceSession.sessionCaseId &&
      voiceSession.transcript.length > 0 &&
      analysis.status === "idle"
    ) {
      void analysis.run(voiceSession.sessionCaseId, voiceSession.transcript);
    }
  }, [
    analysis.run,
    analysis.status,
    voiceSession.phase,
    voiceSession.sessionCaseId,
    voiceSession.transcript,
  ]);

  const startVoiceTest = () => {
    if (!selectedCase) return;
    analysis.reset();
    void voiceSession.startSession(selectedCase);
  };

  return (
    <div className="min-h-screen bg-canvas text-navy">
      <main className="mx-auto min-h-screen w-full max-w-[1180px] px-5 pb-12 sm:px-8 lg:px-10">
        <AppHeader />

        <section className="pt-7" aria-label="Voice test setup">
          <CallForm
            cases={cases}
            selectedCaseId={selectedCaseId}
            disabled={voiceSession.isActive}
            canSubmit={canSubmit}
            onCaseChange={setSelectedCaseId}
            onSubmit={startVoiceTest}
          />
          {casesError && <p className="mt-3 text-sm text-red">{casesError}</p>}
          <CaseSummary callCase={selectedCase} />
        </section>

        <CallStatusIndicator
          phase={voiceSession.phase}
          elapsedSeconds={voiceSession.elapsedSeconds}
          error={voiceSession.error}
          isSpeaking={voiceSession.isSpeaking}
          onEnd={voiceSession.endSession}
        />

        {voiceSession.phase === "done" && (
          <div className="results-grid">
            <TranscriptAccordion transcript={voiceSession.transcript} userLabel="You" />
            <StructuredResultAccordion
              status={analysis.status}
              result={analysis.result}
              error={analysis.error}
            />
          </div>
        )}
      </main>
    </div>
  );
}
