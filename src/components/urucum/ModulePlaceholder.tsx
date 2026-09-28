import type { LucideIcon } from "lucide-react";
import { Clock3 } from "lucide-react";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#e8e4ff] text-[#6d5df5] shadow-[0_10px_22px_rgba(109,93,245,0.1)]">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">Camada de interface</p>
      <h1 className="font-display text-[32px] font-bold tracking-[-0.05em] text-[#342d57]">{title}</h1>
      <p className="mt-3 max-w-[430px] text-[14px] leading-6 text-[#8d879d]">{description}</p>
      <div className="mt-8 flex items-center gap-2 rounded-full border border-[#e9e5f0] bg-white px-4 py-2 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <Clock3 size={14} />
        Fluxos operacionais aguardando definição
      </div>
    </section>
  );
}
