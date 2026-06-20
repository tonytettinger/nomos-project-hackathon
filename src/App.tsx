import { useEffect, useMemo, useState } from "react";
import { fetchCases } from "./api/client";
import { AppHeader } from "./components/AppHeader";
import { CallForm } from "./components/CallForm";
import { CallStatusIndicator } from "./components/CallStatusIndicator";
import { CaseSummary } from "./components/CaseSummary";
import { TranscriptAccordion } from "./components/TranscriptAccordion";
import { useBrowserVoiceSession } from "./features/voice/useBrowserVoiceSession";
import type { CallCase } from "../shared/callSchema";

export default function App() {
  const [cases, setCases] = useState<CallCase[]>([]);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const voiceSession = useBrowserVoiceSession();

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
            onSubmit={() => selectedCase && void voiceSession.startSession(selectedCase)}
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
          <TranscriptAccordion transcript={voiceSession.transcript} userLabel="You" />
        )}
      </main>
    </div>
  );
}
