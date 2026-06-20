import { useEffect, useMemo, useState } from "react";
import { fetchCases } from "./api/client";
import { AppHeader } from "./components/AppHeader";
import { CallForm } from "./components/CallForm";
import { CallStatusIndicator } from "./components/CallStatusIndicator";
import { CaseSummary } from "./components/CaseSummary";
import { TranscriptAccordion } from "./components/TranscriptAccordion";
import { useCallSession } from "./features/calls/useCallSession";
import { e164Schema, type CallCase } from "../shared/callSchema";

function normalizePhoneNumber(value: string) {
  return value.replace(/[\s()-]/g, "");
}

export default function App() {
  const [cases, setCases] = useState<CallCase[]>([]);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const call = useCallSession();

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
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const phoneIsValid = e164Schema.safeParse(normalizedPhone).success;
  const canSubmit = Boolean(selectedCase && phoneIsValid && !call.isActive);

  return (
    <div className="min-h-screen bg-canvas text-navy">
      <main className="mx-auto min-h-screen w-full max-w-[1180px] px-5 pb-12 sm:px-8 lg:px-10">
        <AppHeader />

        <section className="pt-7" aria-label="Call setup">
          <CallForm
            cases={cases}
            selectedCaseId={selectedCaseId}
            phoneNumber={phoneNumber}
            disabled={call.isActive}
            canSubmit={canSubmit}
            onCaseChange={setSelectedCaseId}
            onPhoneChange={setPhoneNumber}
            onSubmit={() => void call.startCall(selectedCaseId, normalizedPhone)}
          />
          {casesError && <p className="mt-3 text-sm text-red">{casesError}</p>}
          <CaseSummary callCase={selectedCase} />
        </section>

        <CallStatusIndicator phase={call.phase} elapsedSeconds={call.elapsedSeconds} error={call.error} />

        {call.details?.status === "done" && (
          <>
            <TranscriptAccordion transcript={call.details.transcript} />
            {call.details.durationSeconds !== null && (
              <p className="mt-4 text-center text-xs font-medium text-slate-400">
                Duration {Math.floor(call.details.durationSeconds / 60)}m {call.details.durationSeconds % 60}s
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
