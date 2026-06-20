import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCall, initiateCall } from "../../api/client";
import type { CallStatus, NormalizedCallDetails } from "../../../shared/callSchema";

const STORAGE_KEY = "nomos-active-call";
const POLL_INTERVAL_MS = 2_000;

type ActiveSession = {
  conversationId: string;
  callSid: string | null;
  caseId: string;
  toNumber: string;
  startedAtMs: number;
};

type CallPhase = "ready" | "starting" | CallStatus;

function readStoredSession(): ActiveSession | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ActiveSession>;
    return typeof parsed.conversationId === "string" &&
      typeof parsed.caseId === "string" &&
      typeof parsed.toNumber === "string" &&
      typeof parsed.startedAtMs === "number"
      ? (parsed as ActiveSession)
      : null;
  } catch {
    return null;
  }
}

export function useCallSession() {
  const [session, setSession] = useState<ActiveSession | null>(() => readStoredSession());
  const [details, setDetails] = useState<NormalizedCallDetails | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isActive = Boolean(session);

  useEffect(() => {
    if (!session) return;
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - session.startedAtMs) / 1000)));
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1_000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    let timeout: number | undefined;
    let activeController: AbortController | null = null;

    const poll = async () => {
      activeController = new AbortController();
      try {
        const nextDetails = await fetchCall(session.conversationId, activeController.signal);
        if (cancelled) return;
        setDetails(nextDetails);

        if (nextDetails.status === "done" || nextDetails.status === "failed") {
          sessionStorage.removeItem(STORAGE_KEY);
          setSession(null);
          if (nextDetails.status === "failed") {
            setRequestError(nextDetails.error ?? "The call did not complete");
          }
          return;
        }

        timeout = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        sessionStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setRequestError(error instanceof Error ? error.message : "Unable to retrieve call status");
      }
    };

    void poll();
    return () => {
      cancelled = true;
      activeController?.abort();
      if (timeout) window.clearTimeout(timeout);
    };
  }, [session?.conversationId]);

  const startCall = useCallback(async (caseId: string, toNumber: string) => {
    setRequestError(null);
    setDetails(null);
    setIsStarting(true);
    setElapsedSeconds(0);

    try {
      const response = await initiateCall(caseId, toNumber);
      const nextSession: ActiveSession = {
        conversationId: response.conversationId,
        callSid: response.callSid,
        caseId,
        toNumber,
        startedAtMs: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to start the call");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const phase = useMemo<CallPhase>(() => {
    if (isStarting) return "starting";
    if (details) return details.status;
    if (session) return "initiated";
    if (requestError) return "failed";
    return "ready";
  }, [details, isStarting, requestError, session]);

  return {
    details,
    elapsedSeconds,
    error: requestError,
    isActive: isActive || isStarting,
    phase,
    startCall,
  };
}
