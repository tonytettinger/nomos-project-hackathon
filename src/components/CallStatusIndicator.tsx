import { Check, PhoneCall, X } from "lucide-react";
import type { CallStatus } from "../../shared/callSchema";
import { formatDuration } from "../lib/format";

export type DisplayPhase = "ready" | "starting" | CallStatus;

type CallStatusIndicatorProps = {
  phase: DisplayPhase;
  elapsedSeconds: number;
  error: string | null;
};

export function CallStatusIndicator({ phase, elapsedSeconds, error }: CallStatusIndicatorProps) {
  const content = getStatusContent(phase, error);
  const isActive = phase === "starting" || phase === "initiated" || phase === "in-progress" || phase === "processing";
  const isDone = phase === "done";
  const isFailed = phase === "failed";

  return (
    <section className={`status-region ${isDone ? "status-region--compact" : ""}`} aria-live="polite" aria-atomic="true">
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
              <PhoneCall className="h-[74px] w-[74px]" strokeWidth={1.6} aria-hidden="true" />
              <span className="status-check"><Check className="h-6 w-6" strokeWidth={2.5} /></span>
            </>
          ) : isFailed ? (
            <X className="h-[72px] w-[72px]" strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <PhoneCall className="h-[82px] w-[82px]" strokeWidth={1.55} aria-hidden="true" />
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-amber" aria-hidden="true" />
          <time>{formatDuration(elapsedSeconds)}</time>
        </div>
      )}

      <h1 className="mt-7 text-center text-[34px] font-bold tracking-[-0.035em] text-navy sm:text-[38px]">
        {content.title}
      </h1>
      <p className={`mt-2 max-w-lg text-center text-[15px] leading-6 ${isFailed ? "text-red" : "text-slate-500"}`}>
        {content.description}
      </p>
    </section>
  );
}

function getStatusContent(phase: DisplayPhase, error: string | null) {
  switch (phase) {
    case "starting":
    case "initiated":
      return { title: "Connecting call", description: "The AI agent is reaching the grid operator." };
    case "in-progress":
      return { title: "Call in progress", description: "The AI agent is speaking with the clerk. Please wait." };
    case "processing":
      return { title: "Finalizing transcript", description: "The call has ended and ElevenLabs is preparing the result." };
    case "done":
      return { title: "Call finished", description: "The call has been completed." };
    case "failed":
      return { title: "Call could not be completed", description: error ?? "Check the number and try again." };
    default:
      return { title: "Ready to call", description: "Review the case details and start the call." };
  }
}
