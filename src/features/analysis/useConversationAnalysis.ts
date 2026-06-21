import { useCallback, useState } from "react";
import type { StructuredCallResult, TranscriptTurn } from "../../../shared/callSchema";
import { analyzeConversation } from "../../api/client";

export type AnalysisStatus = "idle" | "loading" | "done" | "failed";

export function useConversationAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<StructuredCallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const run = useCallback(async (caseId: string, transcript: TranscriptTurn[]) => {
    setStatus("loading");
    setResult(null);
    setError(null);
    try {
      setResult(await analyzeConversation(caseId, transcript));
      setStatus("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to analyze the conversation");
      setStatus("failed");
    }
  }, []);

  return { error, reset, result, run, status };
}
