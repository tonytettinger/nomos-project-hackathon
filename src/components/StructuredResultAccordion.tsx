import { ChevronDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { StructuredCallResult } from "../../shared/callSchema";
import type { AnalysisStatus } from "../features/analysis/useConversationAnalysis";

type StructuredResultAccordionProps = {
  status: AnalysisStatus;
  result: StructuredCallResult | null;
  error: string | null;
};

const labels: Record<keyof StructuredCallResult, string> = {
  outcome: "Outcome",
  vorgangsnummer: "Vorgangsnummer",
  stall_reason: "Stall reason",
  expected_resolution: "Expected resolution",
  resubmission_required: "Resubmission required",
  next_action: "Next action",
  summary: "Summary",
};

export function StructuredResultAccordion({ status, result, error }: StructuredResultAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canOpen = status === "done" && result !== null;

  return (
    <section className="result-accordion">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-default"
        type="button"
        aria-expanded={canOpen && isOpen}
        disabled={!canOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <span className="block text-sm font-semibold text-navy">Structured result</span>
          <span className="mt-0.5 block text-xs text-slate-500">{statusLabel(status, error)}</span>
        </span>
        {status === "loading" ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-blue" aria-hidden="true" />
        ) : (
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {canOpen && isOpen && (
        <div className="border-t border-slate-200 px-5 py-3">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {(Object.keys(labels) as Array<keyof StructuredCallResult>).map((key) => (
                <tr className="border-b border-slate-100 last:border-0" key={key}>
                  <th className="w-[38%] py-3 pr-4 align-top text-xs font-semibold text-slate-500">
                    {labels[key]}
                  </th>
                  <td className="py-3 align-top leading-5 text-slate-700">{formatValue(key, result[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function statusLabel(status: AnalysisStatus, error: string | null) {
  switch (status) {
    case "loading":
      return "Analyzing transcript…";
    case "done":
      return "7 extracted fields";
    case "failed":
      return error ?? "Analysis failed";
    default:
      return "Waiting for transcript";
  }
}

function formatValue(key: keyof StructuredCallResult, value: StructuredCallResult[keyof StructuredCallResult]) {
  if (value === null || value === "") return "Not stated";
  if (key === "resubmission_required") return value ? "Yes" : "No";
  if (key === "outcome") {
    return String(value)
      .split("_")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");
  }
  return String(value);
}
