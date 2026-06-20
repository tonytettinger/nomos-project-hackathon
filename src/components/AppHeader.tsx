export function AppHeader() {
  return (
    <header className="flex h-16 items-center border-b border-slate-200" aria-label="Application header">
      <div className="flex items-center gap-5">
        <span className="text-[22px] font-bold tracking-[-0.04em] text-navy">Nomos</span>
        <span className="h-7 w-px bg-slate-300" aria-hidden="true" />
        <span className="text-[15px] font-medium text-navy">Agent voice test</span>
      </div>
    </header>
  );
}
