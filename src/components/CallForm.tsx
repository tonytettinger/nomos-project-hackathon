import { Laptop, Mic } from "lucide-react";
import type { FormEvent } from "react";
import type { CallCase } from "../../shared/callSchema";

type CallFormProps = {
  cases: CallCase[];
  selectedCaseId: string;
  disabled: boolean;
  canSubmit: boolean;
  onCaseChange: (caseId: string) => void;
  onSubmit: () => void;
};

export function CallForm({
  cases,
  selectedCaseId,
  disabled,
  canSubmit,
  onCaseChange,
  onSubmit,
}: CallFormProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <form className="grid gap-4 md:grid-cols-[minmax(260px,0.9fr)_minmax(280px,1.1fr)_148px]" onSubmit={submit}>
      <div className="grid gap-2 text-xs font-semibold text-slate-600">
        Connection
        <span className="control-shell control-shell--fixed" aria-label="ElevenLabs browser voice connection">
          <Laptop className="h-4 w-4 shrink-0 text-blue" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-sm font-medium text-navy">ElevenLabs browser voice</span>
          <Mic className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        </span>
      </div>

      <label className="grid gap-2 text-xs font-semibold text-slate-600">
        Case
        <select
          className="control-shell appearance-none bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[position:calc(100%-18px)_19px,calc(100%-13px)_19px] bg-[size:5px_5px,5px_5px] bg-no-repeat pr-10 text-sm font-medium text-navy outline-none"
          value={selectedCaseId}
          disabled={disabled || cases.length === 0}
          onChange={(event) => onCaseChange(event.target.value)}
        >
          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} · {item.case_title}
            </option>
          ))}
        </select>
      </label>

      <button
        className="mt-auto h-11 rounded-md bg-blue px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(31,94,255,0.22)] transition hover:bg-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:bg-blue/35 disabled:shadow-none"
        type="submit"
        disabled={!canSubmit}
      >
        Start voice test
      </button>
    </form>
  );
}
