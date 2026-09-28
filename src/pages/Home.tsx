import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home({ authenticated = false }: { authenticated?: boolean }) {
  const accessPath = authenticated ? "/app" : "/auth";
  const accessLabel = authenticated ? "Acessar sistema" : "Entrar no sistema";

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-[#342d57]">
      <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <img src="/avatar_alisson_brilhante.png" alt="Alisson Brilhante" className="h-10 w-10 rounded-[14px] object-cover shadow-[0_8px_18px_rgba(109,93,245,0.18)]" />
          <div>
            <p className="font-display text-[19px] font-bold leading-none tracking-[-0.05em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#a09aaa]">Sistema de Gestão Para Restaurantes</p>
          </div>
        </div>
        <Link to={accessPath} className="inline-flex items-center gap-2 rounded-full border border-[#ded9ef] bg-white px-4 py-2.5 text-[12px] font-bold text-[#6258cf] shadow-[0_5px_15px_rgba(77,64,120,0.04)] transition hover:-translate-y-0.5 hover:border-[#bdb5f7] hover:text-[#4f42c5]">
          {accessLabel} <ArrowRight size={14} />
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-[900px] items-center px-5 pb-14 pt-10 sm:px-8 lg:px-12 lg:pb-24 lg:pt-16">
        <div className="max-w-[620px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#eeeaff] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#7165d7]">
            <Sparkles size={13} /> Uma nova forma de organizar sua cozinha profissional.
          </div>
          <h1 className="font-display text-[42px] font-bold leading-[1.03] tracking-[-0.065em] text-[#342d57] sm:text-[60px] lg:text-[72px]">
            Controle e Gestão acompanhadas de sabor.
          </h1>
          <p className="mt-6 max-w-[540px] text-[16px] leading-7 text-[#837c96] sm:text-[18px]">
            O Urucum nasce da necessidade de criar um Sistema de Gestão através do olhar da cozinha, da realidade operacional. Adequando-se as mais diversas rotinas, garantindo rastreabilidade da operação ponta-a-ponta, gerando o controle e análise das informações em tempo real.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={accessPath} className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#6d5df5] px-5 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(109,93,245,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5b4ada]">
              {authenticated ? "Acessar sistema" : "Conhecer o sistema"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </section>

      <footer className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-5 py-7 text-[11px] text-[#aaa4b4] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <span>URUCUM · Chef Alisson Brilhante</span>
        <span>Uma base comum para decisões rastreáveis.</span>
      </footer>
    </main>
  );
}
