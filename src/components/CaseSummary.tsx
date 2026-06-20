import { Building2, MapPin, ScanLine } from "lucide-react";
import type { CallCase } from "../../shared/callSchema";

type CaseSummaryProps = {
  callCase: CallCase | null;
};

const items = [
  { key: "vnb_name", label: "Grid operator", icon: Building2 },
  { key: "lieferstelle", label: "Delivery address", icon: MapPin },
  { key: "malo_id", label: "MaLo", icon: ScanLine },
] as const;

export function CaseSummary({ callCase }: CaseSummaryProps) {
  if (!callCase) return null;

  return (
    <dl className="case-summary mt-5 rounded-md border border-slate-200 bg-white py-4">
      {items.map(({ key, label, icon: Icon }) => {
        const value = callCase[key];
        if (!value) return null;
        return (
          <div
            className="case-summary__item flex min-w-0 gap-3 px-4"
            key={key}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.7} aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium leading-5 text-navy">{value}</dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
