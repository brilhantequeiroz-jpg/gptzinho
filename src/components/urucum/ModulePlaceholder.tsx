import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock3 } from "lucide-react";

type ModulePlaceholderProps = {
  title: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
};

export function ModulePlaceholder({ title, icon: Icon, actionLabel, onAction }: ModulePlaceholderProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#e8e4ff] text-[#6d5df5] shadow-[0_10px_22px_rgba(109,93,245,0.1)]">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">Rótulo provisório</p>
      <h1 className="font-display text-[32px] font-bold tracking-[-0.05em] text-[#342d57]">{title}</h1>
      <p className="mt-3 max-w-[430px] text-[14px] leading-6 text-[#8d879d]">
        Espaço visual reservado. O contexto, os campos e o comportamento desta tela estão pendentes de definição.
      </p>
      <div className="mt-8 flex items-center gap-2 rounded-full border border-[#e9e5f0] bg-white px-4 py-2 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <Clock3 size={14} />
        Sem operação definida
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-[#6d5df5] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_16px_rgba(109,93,245,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5b4ada]">
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </section>
  );
}
