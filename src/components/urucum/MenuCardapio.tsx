import { Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

const MENU_IMAGE = "/cardapio-alisson-brilhante.jpg";

export function MenuCardapio() {
  const [zoom, setZoom] = useState(1);

  return (
    <section className="flex min-h-full flex-col gap-5 pb-8" aria-labelledby="menu-cardapio-title">
      <div className="flex flex-col gap-4 border-b border-[#e5e2d5] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9270]">Coletânea Pessoal</p>
          <h1 id="menu-cardapio-title" className="font-display text-[28px] font-bold leading-tight tracking-[-0.05em] text-[#3d4e45] sm:text-[36px]">
            Cardápios
          </h1>
          <p className="mt-2 max-w-[540px] text-[13px] leading-6 text-[#7f857a]">
            Explore o menu completo Alisson Brilhante. Deslize para os lados para visualizar todos os grupos e preparos.
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-[14px] border border-[#dfdfd0] bg-white/80 p-1 shadow-[0_5px_16px_rgba(67,78,47,0.06)] sm:self-auto" aria-label="Controles de zoom">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.15).toFixed(2))))}
            disabled={zoom <= 0.7}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#67745b] transition hover:bg-[#eef0e4] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Diminuir zoom"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[52px] text-center text-[11px] font-bold text-[#59664e]" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(1.8, Number((current + 0.15).toFixed(2))))}
            disabled={zoom >= 1.8}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#67745b] transition hover:bg-[#eef0e4] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Aumentar zoom"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="ml-1 flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[11px] font-semibold text-[#78836d] transition hover:bg-[#eef0e4]"
            aria-label="Redefinir zoom"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Redefinir</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[22px] border border-[#dfe1d2] bg-[#e7e5d4] p-3 shadow-[0_14px_30px_rgba(58,72,50,0.1)] sm:p-5">
        <div className="min-w-max rounded-[12px] bg-white shadow-[0_4px_14px_rgba(49,59,39,0.12)]">
          <img
            src={MENU_IMAGE}
            alt="Cardápio completo do restaurante Alisson Brilhante"
            className="block h-auto rounded-[12px]"
            style={{ width: `${zoom * 1500}px` }}
          />
        </div>
      </div>
      <p className="text-center text-[10px] font-medium text-[#9a9c8c]">Use a barra inferior ou deslize horizontalmente para percorrer o cardápio.</p>
    </section>
  );
}

export default MenuCardapio;
