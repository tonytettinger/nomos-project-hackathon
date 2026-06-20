import { Check, Laptop, Mic, PhoneOff, X } from "lucide-react";
import type { BrowserVoicePhase } from "../features/voice/useBrowserVoiceSession";
import { formatDuration } from "../lib/format";

type CallStatusIndicatorProps = {
  phase: BrowserVoicePhase;
  elapsedSeconds: number;
  error: string | null;
  isSpeaking: boolean;
  onEnd: () => void;
};

export function CallStatusIndicator({
  phase,
  elapsedSeconds,
  error,
  isSpeaking,
  onEnd,
}: CallStatusIndicatorProps) {
  const content = getStatusContent(phase, error, isSpeaking);
  const isActive = phase === "starting" || phase === "connected" || phase === "ending";
  const isDone = phase === "done";
  const isFailed = phase === "failed";

  return (
    <section className={`status-region ${isDone ? "status-region--compact" : ""}`}>
      <div className={`status-orb ${isActive ? "status-orb--active" : ""} ${isDone ? "status-orb--done" : ""} ${isFailed ? "status-orb--failed" : ""}`}>
        {isActive && (
          <div className="pulse-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
        <div className="status-orb__core">
          {isDone ? (
            <>
              <Laptop className="h-[70px] w-[70px]" strokeWidth={1.55} aria-hidden="true" />
              <span className="status-check"><Check className="h-6 w-6" strokeWidth={2.5} /></span>
            </>
          ) : isFailed ? (
            <X className="h-[72px] w-[72px]" strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <Mic className="h-[78px] w-[78px]" strokeWidth={1.45} aria-hidden="true" />
          )}
        </div>
      </div>

      {(phase === "connected" || phase === "ending") && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-amber" aria-hidden="true" />
          <time>{formatDuration(elapsedSeconds)}</time>
        </div>
      )}

      <div className="contents" role="status" aria-live="polite" aria-atomic="true">
        <h1 className="mt-7 text-center text-[34px] font-bold tracking-[-0.035em] text-navy sm:text-[38px]">
          {content.title}
        </h1>
        <p className={`mt-2 max-w-lg text-center text-[15px] leading-6 ${isFailed ? "text-red" : "text-slate-500"}`}>
          {content.description}
        </p>
      </div>

      {phase === "connected" && (
        <div className="call-diagnostics">
          <div className="call-diagnostics__status">
            <span>Connection</span>
            <strong>WebRTC · laptop audio</strong>
          </div>
          <button type="button" className="cancel-call-button" onClick={onEnd}>
            <PhoneOff className="h-4 w-4" aria-hidden="true" />
            End voice test
          </button>
        </div>
      )}
    </section>
  );
}

function getStatusContent(phase: BrowserVoicePhase, error: string | null, isSpeaking: boolean) {
  switch (phase) {
    case "starting":
      return {
        title: "Connecting to ElevenLabs",
        description: "Allow microphone access when prompted. No phone call will be placed.",
      };
    case "connected":
      return isSpeaking
        ? { title: "Agent is speaking", description: "Listen through your laptop speakers. You can interrupt naturally." }
        : { title: "Agent is listening", description: "Speak through your laptop microphone." };
    case "ending":
      return { title: "Ending voice test", description: "Closing the ElevenLabs browser session." };
    case "done":
      return { title: "Voice test finished", description: "The browser conversation has ended." };
    case "failed":
      return { title: "Voice test could not start", description: error ?? "Check microphone access and try again." };
    default:
      return { title: "Ready for voice test", description: "Select a case and talk to the real agent through this laptop." };
  }
}
