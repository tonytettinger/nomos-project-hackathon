import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CallCase, TranscriptTurn } from "../../../shared/callSchema";
import { toDynamicVariables } from "../../../shared/callSchema";
import { fetchConversationToken } from "../../api/client";

export type BrowserVoicePhase = "ready" | "starting" | "connected" | "ending" | "done" | "failed";

export function useBrowserVoiceSession() {
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingSession, setIsRequestingSession] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const connectedAtRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      connectedAtRef.current = Date.now();
      setIsRequestingSession(false);
      setHasEnded(false);
    },
    onDisconnect: (details) => {
      setIsRequestingSession(false);
      setIsEnding(false);
      if (details.reason === "error") {
        setError(details.message);
      } else if (connectedAtRef.current !== null) {
        setHasEnded(true);
      }
      connectedAtRef.current = null;
    },
    onError: (message) => {
      setError(message);
      setIsRequestingSession(false);
      setIsEnding(false);
    },
    onMessage: ({ role, message }) => {
      const turn: TranscriptTurn = {
        role,
        message,
        timeInCallSeconds:
          connectedAtRef.current === null
            ? null
            : Math.max(0, Math.floor((Date.now() - connectedAtRef.current) / 1_000)),
      };
      setTranscript((current) => appendDistinctTurn(current, turn));
    },
  });

  const isActive =
    conversation.status === "connected" ||
    conversation.status === "connecting" ||
    isRequestingSession ||
    isEnding;

  useEffect(() => {
    if (!isActive || connectedAtRef.current === null) return;
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - connectedAtRef.current!) / 1_000));
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1_000);
    return () => window.clearInterval(interval);
  }, [isActive]);

  const startSession = useCallback(
    async (callCase: CallCase) => {
      setError(null);
      setTranscript([]);
      setElapsedSeconds(0);
      setHasEnded(false);
      setIsEnding(false);
      setIsRequestingSession(true);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone access is not available in this browser.");
        }
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissionStream.getTracks().forEach((track) => track.stop());
        const conversationToken = await fetchConversationToken();
        conversation.startSession({
          conversationToken,
          connectionType: "webrtc",
          dynamicVariables: toDynamicVariables(callCase),
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to start the browser voice session");
        setIsRequestingSession(false);
      }
    },
    [conversation],
  );

  const endSession = useCallback(() => {
    setIsEnding(true);
    conversation.endSession();
  }, [conversation]);

  const phase = useMemo<BrowserVoicePhase>(() => {
    if (isRequestingSession || conversation.status === "connecting") return "starting";
    if (error || conversation.status === "error") return "failed";
    if (isEnding) return "ending";
    if (conversation.status === "connected") return "connected";
    if (hasEnded) return "done";
    return "ready";
  }, [conversation.status, error, hasEnded, isEnding, isRequestingSession]);

  return {
    elapsedSeconds,
    endSession,
    error: error ?? conversation.message ?? null,
    isActive,
    isSpeaking: conversation.isSpeaking,
    phase,
    startSession,
    transcript,
  };
}

export function appendDistinctTurn(current: TranscriptTurn[], next: TranscriptTurn) {
  const previous = current.at(-1);
  if (previous?.role === next.role && previous.message === next.message) return current;
  return [...current, next];
}
