import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { Cycle01Panel } from "@/components/urucum/Cycle01Panel";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";
import { ModulePlaceholder } from "@/components/urucum/ModulePlaceholder";
import {
  ArrowUp,
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  ClipboardPenLine,
  Clock3,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MoreHorizontal,
  PackageSearch,
  Paperclip,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Star,
  Utensils,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  {
    icon: Lightbulb,
    title: "Ideias para um projeto",
    description: "Me ajude a tirar uma ideia do papel",
    color: "bg-[#fff1d8] text-[#d98224]",
    prompt: "Me ajude a tirar uma ideia criativa do papel",
  },
  {
    icon: FileText,
    title: "Escrever melhor",
    description: "Revise, resuma ou transforme um texto",
    color: "bg-[#e6e3ff] text-[#6558db]",
    prompt: "Quero escrever um texto mais claro e envolvente",
  },
  {
    icon: Zap,
    title: "Resolver uma dúvida",
    description: "Explique algo de um jeito simples",
    color: "bg-[#dff5ec] text-[#279b70]",
    prompt: "Explique um assunto difícil de um jeito simples",
  },
];

type ModuleKey =
  | "dashboard"
  | "pedidos"
  | "cardapio"
  | "estoque"
  | "compras"
  | "fichas"
  | "financeiro"
  | "relatorios"
  | "gptzinho";

type ModuleItem = {
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
};

const modules: ModuleItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "pedidos", label: "Pedidos", icon: ClipboardList },
  { key: "cardapio", label: "Cardápio", icon: Utensils },
  { key: "estoque", label: "Estoque", icon: PackageSearch },
  { key: "compras", label: "Compras", icon: ShoppingCart },
  { key: "fichas", label: "Fichas Técnicas", icon: ClipboardPenLine },
  { key: "financeiro", label: "Financeiro", icon: WalletCards },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "gptzinho", label: "GPTzinho", icon: Sparkles },
];

function RobotMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`robot-mark overflow-hidden ${small ? "robot-mark-small" : ""}`} aria-hidden="true">
      <img src="/avatar-alisson-brilhante.png" alt="" className="h-full w-full object-cover object-center" />
    </div>
  );
}

const assistantReplies = [
  "Adorei essa ideia! Posso te ajudar a organizar os próximos passos, encontrar um bom ponto de partida e transformar tudo em algo bem prático. Por onde você gostaria de começar?",
  "Claro! Vamos deixar isso simples e bem estruturado. Me conte um pouco mais sobre o que você tem em mente e eu monto um caminho para você.",
  "Boa pergunta. Vou pensar com você de um jeito direto, trazendo exemplos e alternativas para facilitar a sua decisão.",
];

const Index = () => {
  const { session } = useAuth();
  const { roles } = useUrucumRoles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey>("gptzinho");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeModuleItem = modules.find((module) => module.key === activeModule) ?? modules[0];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startNewChat = () => {
    setActiveModule("gptzinho");
    setMessages([]);
    setInput("");
    setIsSidebarOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || isTyping) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: trimmed },
    ]);
    setInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantReplies[current.length % assistantReplies.length],
        },
      ]);
      setIsTyping(false);
    }, 650);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#28233f] selection:bg-[#ded9ff] selection:text-[#43368f]">
      <div className="flex min-h-screen overflow-hidden">
        {isSidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-[#2d244b]/30 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[282px] -translate-x-full flex-col border-r border-[#ece9f1] bg-[#f7f5ff] px-4 py-5 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : ""}`}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 overflow-hidden rounded-[13px] bg-[#dfe8ea] shadow-[0_7px_16px_rgba(77,99,103,0.2)]">
                <img src="/avatar-alisson-brilhante.png" alt="Alisson Brilhante" className="h-full w-full object-cover object-center" />
              </div>
              <div>
                <p className="font-display text-[18px] font-bold leading-none tracking-[-0.04em] text-[#302a54]">URUCUM<span className="text-[#f08c6c]">.</span></p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9d97b0]">Chef Alisson Brilhante</p>
              </div>
            </div>
            <button
              className="rounded-lg p-1.5 text-[#a29cb7] transition hover:bg-white hover:text-[#6d5df5] md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={19} />
            </button>
          </div>

          <Button
            onClick={startNewChat}
            className="mb-6 h-11 w-full justify-center gap-2 rounded-[14px] bg-[#6d5df5] font-semibold text-white shadow-[0_8px_16px_rgba(109,93,245,0.2)] transition hover:-translate-y-0.5 hover:bg-[#5e4ee1]"
          >
            <Plus size={17} strokeWidth={2.5} />
            Nova conversa
          </Button>

          <div className="mb-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa5bd]">Navegação provisória</p>
          </div>
          <nav className="mb-6 space-y-1" aria-label="Módulos do URUCUM">
            {modules.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveModule(key);
                  setIsSidebarOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition ${activeModule === key ? "bg-white text-[#423b65] shadow-[0_4px_14px_rgba(80,67,128,0.07)]" : "text-[#77718d] hover:bg-white/70"}`}
              >
                <Icon size={16} className={activeModule === key ? "text-[#6d5df5]" : "text-[#aaa5bd]"} />
                <span className={`min-w-0 flex-1 truncate text-[12px] ${activeModule === key ? "font-bold" : "font-medium"}`}>{label}</span>
                {key === "gptzinho" && <span className="h-1.5 w-1.5 rounded-full bg-[#42bc8c]" />}
              </button>
            ))}
          </nav>

          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa5bd]">Conversas</p>
            <button className="rounded-md p-1 text-[#aaa5bd] transition hover:bg-white hover:text-[#6d5df5]" aria-label="Pesquisar conversas">
              <Search size={14} />
            </button>
          </div>
          <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-3 py-3 text-[11px] leading-5 text-[#aaa5b6]">
            Histórico de conversas pendente de definição.
          </div>

          <div className="mt-auto space-y-1 border-t border-[#e8e4f0] pt-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-[#77718d] transition hover:bg-white hover:text-[#423b65]">
              <Star size={16} /> Favoritos
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-[#77718d] transition hover:bg-white hover:text-[#423b65]">
              <Settings2 size={16} /> Configurações
            </button>
            <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-white/70 px-3 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5b19d] text-[11px] font-bold text-white">?</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[#423b65]">{session?.user.email ?? "Usuário atual"}</p>
                <p className="truncate text-[10px] text-[#aaa5bd]">{roles.length ? roles.join(" · ") : "Papel pendente de atribuição"}</p>
              </div>
              <ChevronDown size={14} className="text-[#aaa5bd]" />
            </div>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col bg-[#fbfaf8]">
          <header className="flex h-[73px] items-center justify-between border-b border-[#efedf1] px-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2 text-[#817a95] transition hover:bg-white hover:text-[#6d5df5] md:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={21} />
              </button>
              <div className="hidden items-center gap-2 text-[12px] text-[#aba6b7] sm:flex">
                <span>URUCUM</span>
                <span className="text-[#d3cfda]">/</span>
              </div>
              <span className="max-w-[190px] truncate text-[13px] font-semibold text-[#4b4564] sm:max-w-none">
                {activeModuleItem.label}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 rounded-full bg-[#f0edff] px-3 py-1.5 text-[11px] font-semibold text-[#6d5df5] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6d5df5]" />
                Assistente GPTzinho
              </div>
              <button className="relative rounded-xl p-2 text-[#918ba2] transition hover:bg-white hover:text-[#6d5df5]" aria-label="Notificações">
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f08c6c]" />
              </button>
              <button className="rounded-xl p-2 text-[#918ba2] transition hover:bg-white hover:text-[#6d5df5]" aria-label="Mais opções">
                <MoreHorizontal size={19} />
              </button>
            </div>
          </header>

          <div className="chat-pattern flex flex-1 flex-col overflow-y-auto px-5 pb-5 sm:px-8 lg:px-12">
            <div className={`mx-auto flex w-full max-w-[900px] flex-1 flex-col ${messages.length ? "pt-8" : "justify-center pb-6 pt-10"}`}>
              {activeModule === "gptzinho" ? (
                messages.length === 0 ? (
                <>
                  <section className="animate-fade-up mb-9 text-center">
                    <div className="relative mx-auto mb-7 w-fit">
                      <div className="absolute -inset-5 rounded-full bg-[#e7e3ff]/60 blur-2xl" />
                      <RobotMark />
                    </div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">Seu parceiro de ideias</p>
                    <h1 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.055em] text-[#342d57] sm:text-[44px]">
                      Olá, eu sou o <span className="text-[#6d5df5]">Gptzinho.</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-[460px] text-[14px] leading-6 text-[#8d879d] sm:text-[15px]">
                      Um cantinho para pensar junto, organizar suas ideias e fazer acontecer. O que vamos criar hoje?
                    </p>
                  </section>

                  <section className="animate-fade-up grid gap-3 sm:grid-cols-3" style={{ animationDelay: "120ms" }}>
                    {starterPrompts.map(({ icon: Icon, title, description, color, prompt }) => (
                      <button
                        key={title}
                        onClick={() => sendMessage(prompt)}
                        className="group rounded-[18px] border border-[#eeebf1] bg-white/80 p-4 text-left shadow-[0_6px_20px_rgba(77,64,120,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#dcd6ff] hover:bg-white hover:shadow-[0_12px_26px_rgba(77,64,120,0.09)]"
                      >
                        <span className={`mb-5 flex h-9 w-9 items-center justify-center rounded-[11px] ${color}`}>
                          <Icon size={17} strokeWidth={2.3} />
                        </span>
                        <span className="mb-1 block text-[13px] font-bold text-[#4c4665]">{title}</span>
                        <span className="block text-[11px] leading-5 text-[#a09aaa]">{description}</span>
                        <span className="mt-3 block text-[11px] font-semibold text-[#6d5df5] opacity-0 transition group-hover:opacity-100">Começar →</span>
                      </button>
                    ))}
                  </section>
                </>
              ) : (
                <section className="space-y-6 pb-8">
                  <div className="mb-8 flex items-center gap-3 border-b border-[#eeeaf1] pb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8e4ff] text-[#6d5df5]"><Clock3 size={15} /></div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#aaa4b7]">Conversa iniciada</p>
                      <p className="text-[13px] font-semibold text-[#514a6e]">Vamos explorar essa ideia juntos</p>
                    </div>
                  </div>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && <RobotMark small />}
                      <div className={`max-w-[min(680px,85%)] rounded-[20px] px-4 py-3.5 text-[14px] leading-6 ${message.role === "user" ? "rounded-br-[6px] bg-[#6d5df5] text-white shadow-[0_7px_18px_rgba(109,93,245,0.16)]" : "rounded-tl-[6px] border border-[#ece9f2] bg-white text-[#625b77] shadow-[0_5px_16px_rgba(77,64,120,0.04)]"}`}>
                        {message.content}
                      </div>
                      {message.role === "user" && <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5b19d] text-[9px] font-bold text-white">LM</div>}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-3.5">
                      <RobotMark small />
                      <div className="flex items-center gap-1 rounded-[18px] rounded-tl-[6px] border border-[#ece9f2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(77,64,120,0.04)]">
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    </div>
                  )}
                </section>
              )
              ) : activeModule === "pedidos" || activeModule === "compras" || activeModule === "estoque" ? (
                <Cycle01Panel focus={activeModule} />
              ) : (
                <ModulePlaceholder title={activeModuleItem.label} icon={activeModuleItem.icon} />
              )}
            </div>
          </div>

          {activeModule === "gptzinho" && (
            <div className="bg-[#fbfaf8] px-5 pb-5 pt-3 sm:px-8 lg:px-12">
              <div className="mx-auto w-full max-w-[900px]">
              <form onSubmit={handleSubmit} className="group relative rounded-[20px] border border-[#e5e1ee] bg-white p-2 shadow-[0_10px_30px_rgba(70,58,112,0.08)] transition focus-within:border-[#bdb5f7] focus-within:shadow-[0_12px_32px_rgba(109,93,245,0.13)]">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Converse com o Gptzinho..."
                  rows={1}
                  className="max-h-28 min-h-[48px] w-full resize-none bg-transparent px-3 pb-10 pt-3 text-[14px] text-[#443d61] outline-none placeholder:text-[#b0abba]"
                  aria-label="Escreva sua mensagem"
                />
                <div className="absolute bottom-2.5 left-3 flex items-center gap-1">
                  <button type="button" className="rounded-lg p-1.5 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label="Anexar arquivo"><Paperclip size={16} /></button>
                  <span className="hidden text-[10px] text-[#b3aebc] sm:block">Shift + Enter para nova linha</span>
                </div>
                <button type="submit" disabled={!input.trim() || isTyping} className="absolute bottom-2.5 right-3 flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#6d5df5] text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e5e1f5] disabled:text-[#aaa4c2]" aria-label="Enviar mensagem">
                  <ArrowUp size={17} strokeWidth={2.5} />
                </button>
              </form>
                <p className="mt-3 text-center text-[10px] text-[#b3aebc]">O Gptzinho pode cometer erros. Confirme informações importantes.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
