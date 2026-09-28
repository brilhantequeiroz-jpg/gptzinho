import { ArrowRight, Check, ChefHat, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  "Decisões mais claras",
  "Registros que permanecem",
  "Uma visão comum da operação",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-[#342d57]">
      <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <img src="/avatar_alisson_brilhante.png" alt="Alisson Brilhante" className="h-10 w-10 rounded-[14px] object-cover shadow-[0_8px_18px_rgba(109,93,245,0.18)]" />
          <div>
            <p className="font-display text-[19px] font-bold leading-none tracking-[-0.05em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#a09aaa]">Base comum para decidir</p>
          </div>
        </div>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-[#ded9ef] bg-white px-4 py-2.5 text-[12px] font-bold text-[#6258cf] shadow-[0_5px_15px_rgba(77,64,120,0.04)] transition hover:-translate-y-0.5 hover:border-[#bdb5f7] hover:text-[#4f42c5]">
          Entrar no sistema <ArrowRight size={14} />
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-[1240px] items-center gap-12 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12 lg:pb-24 lg:pt-16">
        <div className="max-w-[620px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#eeeaff] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#7165d7]">
            <Sparkles size={13} /> Uma nova forma de organizar a cozinha
          </div>
          <h1 className="font-display text-[42px] font-bold leading-[1.03] tracking-[-0.065em] text-[#342d57] sm:text-[60px] lg:text-[72px]">
            O sabor começa com uma <span className="text-[#6d5df5]">decisão bem cuidada.</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-[16px] leading-7 text-[#837c96] sm:text-[18px]">
            O URUCUM aproxima a experiência do Chef Alisson Brilhante de uma base comum para organizar necessidades, compras, recebimentos e decisões do dia a dia.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth" className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#6d5df5] px-5 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(109,93,245,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5b4ada]">
              Conhecer o sistema <ArrowRight size={16} />
            </Link>
            <a href="#chef" className="inline-flex h-12 items-center justify-center rounded-[14px] border border-[#e2deeb] bg-white px-5 text-[13px] font-bold text-[#625b77] transition hover:border-[#c9c2e8] hover:text-[#6d5df5]">
              Sobre o Chef
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[500px] lg:mr-0">
          <div className="absolute -left-7 top-8 h-24 w-24 rounded-[26px] bg-[#f9c49e] sm:-left-10 sm:h-32 sm:w-32" />
          <div className="absolute -bottom-7 right-2 h-28 w-28 rounded-full bg-[#dcd7ff] sm:-right-5 sm:h-40 sm:w-40" />
          <div className="relative overflow-hidden rounded-[34px] border-[10px] border-white bg-[#eeeaff] shadow-[0_22px_55px_rgba(77,64,120,0.14)]">
            <img src="/avatar_alisson_brilhante.png" alt="Chef Alisson Brilhante" className="aspect-[4/5] w-full object-cover" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[20px] border border-white/70 bg-white/90 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">À frente do URUCUM</p>
              <p className="mt-1 font-display text-[19px] font-bold tracking-[-0.04em] text-[#423b65]">Chef Alisson Brilhante</p>
            </div>
          </div>
        </div>
      </section>

      <section id="chef" className="border-y border-[#eeeaf1] bg-white/70">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-12 lg:py-16">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fce7d8] text-[#d9825f]"><ChefHat size={25} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa3b7]">Uma cozinha com identidade</p>
              <p className="mt-1 font-display text-[21px] font-bold tracking-[-0.04em] text-[#423b65]">A visão do Chef no centro.</p>
            </div>
          </div>
          <div>
            <p className="max-w-[680px] text-[16px] leading-7 text-[#7f7891]">O URUCUM nasce para dar forma às decisões que sustentam uma operação: o que é necessário, o que foi comprado, o que chegou e o que precisa ser acompanhado.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {values.map((value) => (
                <div key={value} className="flex items-start gap-2 text-[12px] font-semibold leading-5 text-[#5f5876]"><Check size={15} className="mt-0.5 shrink-0 text-[#6d5df5]" /> {value}</div>
              ))}
            </div>
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
