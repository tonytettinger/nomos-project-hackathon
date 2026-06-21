import { ChevronDown, Copy, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import type { TranscriptTurn } from "../../shared/callSchema";
import { formatDuration } from "../lib/format";

type TranscriptAccordionProps = {
  transcript: TranscriptTurn[];
  userLabel?: string;
};

export function TranscriptAccordion({ transcript, userLabel = "Clerk" }: TranscriptAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (transcript.length === 0) return null;

  const copyTranscript = async () => {
    const text = transcript
      .map((turn) => `${turn.role === "agent" ? "AI agent" : userLabel}: ${turn.message}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <section className="result-accordion">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <span className="block text-sm font-semibold text-navy">Transcript</span>
          <span className="mt-0.5 block text-xs text-slate-500">{transcript.length} conversation turns</span>
        </span>
        <ChevronDown className={`h-5 w-5 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-5 pb-5">
          <div className="flex justify-end py-3">
            <button className="copy-button" type="button" onClick={copyTranscript}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? "Copied" : "Copy transcript"}
            </button>
          </div>
          <ol className="space-y-4">
            {transcript.map((turn, index) => {
              const isAgent = turn.role === "agent";
              const Icon = isAgent ? Sparkles : UserRound;
              return (
                <li className="grid grid-cols-[24px_1fr_auto] gap-3" key={`${turn.timeInCallSeconds ?? index}-${index}`}>
                  <Icon className={`mt-0.5 h-4 w-4 ${isAgent ? "text-blue" : "text-green"}`} aria-hidden="true" />
                  <div>
                    <p className={`text-xs font-semibold ${isAgent ? "text-blue" : "text-green"}`}>
                      {isAgent ? "AI agent" : turn.role === "user" ? userLabel : "System"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{turn.message}</p>
                  </div>
                  <time className="text-[11px] text-slate-400">
                    {turn.timeInCallSeconds === null ? "" : formatDuration(turn.timeInCallSeconds)}
                  </time>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
