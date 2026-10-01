import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  FileCheck2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Filter,
  Search,
  Eye,
  X,
  Printer,
  Download,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type Invoice = {
  id: string;
  purchase_order_id: string;
  supplier_id: string | null;
  supplier_name: string;
  reference: string;
  launched_at: string;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_id: string;
  quantity: number;
};

type Item = {
  id: string;
  name: string;
};

type Confirmation = {
  invoice_id: string;
  confirmed_at: string;
};

type Ficha = {
  id: string;
  product_name: string;
  cardapio_price: number;
  total_cost: number;
  gross_profit: number;
  mark_up: number;
  portions: number;
  status: string;
};

type TabKey = "resumo" | "nfs" | "custos";

const tabs: { key: TabKey; label: string; icon: typeof WalletCards }[] = [
  { key: "resumo", label: "Resumo", icon: WalletCards },
  { key: "nfs", label: "Notas Fiscais", icon: FileCheck2 },
  { key: "custos", label: "Custos por Produto", icon: TrendingUp },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function FinanceiroPanel() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const results = await Promise.all([
      supabase.from("invoices").select("*").order("launched_at", { ascending: false }),
      supabase.from("invoice_items").select("*"),
      supabase.from("items").select("id,name").order("name"),
      supabase.from("receipt_confirmations").select("*"),
      supabase.from("fichas_tecnicas").select("*").order("created_at", { ascending: false }),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
    setInvoices(results[0].data ?? []);
    setInvoiceItems(results[1].data ?? []);
    setItems(results[2].data ?? []);
    setConfirmations(results[3].data ?? []);
    setFichas(results[4].data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const itemName = (id: string) => items.find((item) => item.id === id)?.name ?? "Item pendente";
  const invoiceItemsFor = (invoiceId: string) => invoiceItems.filter((item) => item.invoice_id === invoiceId);

  // Calculate totals
  const totalInvoices = invoices.length;
  const confirmedInvoices = confirmations.length;
  const pendingInvoices = totalInvoices - confirmedInvoices;

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (filterSupplier) {
      result = result.filter((inv) => inv.supplier_id === filterSupplier);
    }
    if (filterStatus === "confirmado") {
      result = result.filter((inv) => confirmations.some((conf) => conf.invoice_id === inv.id));
    } else if (filterStatus === "pendente") {
      result = result.filter((inv) => !confirmations.some((conf) => conf.invoice_id === inv.id));
    }
    if (dateFrom) {
      result = result.filter((inv) => inv.launched_at >= dateFrom + "T00:00:00.000Z");
    }
    if (dateTo) {
      result = result.filter((inv) => inv.launched_at <= dateTo + "T23:59:59.999Z");
    }
    if (searchTerm) {
      result = result.filter((inv) =>
        inv.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [invoices, filterSupplier, filterStatus, dateFrom, dateTo, searchTerm, confirmations]);

  // Filter fichas
  const filteredFichas = useMemo(() => {
    let result = fichas;
    if (searchTerm) {
      result = result.filter((f) => f.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return result;
  }, [fichas, searchTerm]);

  const roleNotice = (role: string) =>
    rolesLoading ? "Verificando autoridade…" : hasRole(role) ? "" : "Autoridade pendente de atribuição.";

  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · FINANCEIRO</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Gestão Financeira</h1>
          <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#8d879d]">
            Acompanhe as notas fiscais, custos e rentabilidade dos produtos do cardápio.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 grid gap-2 rounded-[18px] border border-[#ebe7f0] bg-white p-2 shadow-[0_7px_20px_rgba(77,64,120,0.04)] sm:grid-cols-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center justify-center gap-2 rounded-[13px] px-3 py-3 text-[11px] font-semibold transition ${
              activeTab === key
                ? "bg-[#6d5df5] text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)]"
                : "text-[#817a95] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center text-sm text-[#918ba2]">
          Carregando dados financeiros…
        </div>
      ) : (
        <div className="space-y-5">
          {/* RESUMO TAB */}
          {activeTab === "resumo" && (
            <div className="space-y-5">
              {/* Metrics */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f0edff] text-[#6d5df5]">
                      <FileCheck2 size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Total NFs</p>
                  </div>
                  <p className="mt-3 font-display text-[28px] font-bold text-[#423b65]">{totalInvoices}</p>
                </div>
                <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e8f5e9] text-[#2e7d32]">
                      <TrendingUp size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Confirmadas</p>
                  </div>
                  <p className="mt-3 font-display text-[28px] font-bold text-[#2e7d32]">{confirmedInvoices}</p>
                </div>
                <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#fff3e0] text-[#ef6c00]">
                      <TrendingDown size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Pendentes</p>
                  </div>
                  <p className="mt-3 font-display text-[28px] font-bold text-[#ef6c00]">{pendingInvoices}</p>
                </div>
                <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e3f2fd] text-[#1976d2]">
                      <Package size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Produtos</p>
                  </div>
                  <p className="mt-3 font-display text-[28px] font-bold text-[#1976d2]">{fichas.length}</p>
                </div>
              </div>

              {/* Authority notice */}
              <div className="flex items-center gap-2 rounded-[14px] border border-[#f2dfad] bg-[#fff9e9] px-4 py-3 text-[12px] text-[#957327]">
                <AlertCircle size={15} />
                {hasRole("gerencia")
                  ? "Visão completa do financeiro disponível para Gerência."
                  : "Autoridade de Gerência pendente de atribuição para acesso completo ao financeiro."}
              </div>

              {/* Recent invoices */}
              <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                <h2 className="mb-4 font-display text-[17px] font-bold text-[#423b65]">Últimas Notas Fiscais</h2>
                {invoices.length > 0 ? (
                  <div className="divide-y divide-[#f0edf4]">
                    {invoices.slice(0, 5).map((invoice) => {
                      const isConfirmed = confirmations.some((conf) => conf.invoice_id === invoice.id);
                      return (
                        <div key={invoice.id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-[13px] font-semibold text-[#514a6e]">{invoice.reference}</p>
                            <p className="mt-0.5 text-[11px] text-[#a09aaa]">
                              {invoice.supplier_name} · {formatDate(invoice.launched_at)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              isConfirmed ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#fff3e0] text-[#ef6c00]"
                            }`}
                          >
                            {isConfirmed ? "Confirmada" : "Pendente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-7 text-center text-[12px] text-[#aaa5b6]">
                    Nenhuma nota fiscal lançada.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* NFS TAB */}
          {activeTab === "nfs" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-4 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por referência ou fornecedor..."
                      className="h-9 w-full rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                    />
                  </div>
                  <div className="relative">
                    <Filter size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                    >
                      <option value="">Todos os status</option>
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                    />
                  </div>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                    />
                  </div>
                </div>
              </div>

              {/* Invoices list */}
              <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-[17px] font-bold text-[#423b65]">Notas Fiscais</h2>
                  <span className="text-[11px] text-[#aaa5b6]">{filteredInvoices.length} registro(s)</span>
                </div>
                {filteredInvoices.length > 0 ? (
                  <div className="divide-y divide-[#f0edf4]">
                    {filteredInvoices.map((invoice) => {
                      const isConfirmed = confirmations.some((conf) => conf.invoice_id === invoice.id);
                      const invItems = invoiceItemsFor(invoice.id);
                      return (
                        <div key={invoice.id} className="py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[13px] font-semibold text-[#514a6e]">{invoice.reference}</p>
                              <p className="mt-0.5 text-[11px] text-[#a09aaa]">
                                {invoice.supplier_name} · {formatDate(invoice.launched_at)}
                              </p>
                              <p className="mt-1 text-[11px] text-[#8d879d]">
                                {invItems.map((item) => `${itemName(item.item_id)} · ${item.quantity}`).join(" | ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  isConfirmed ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-[#fff3e0] text-[#ef6c00]"
                                }`}
                              >
                                {isConfirmed ? "Confirmada" : "Pendente"}
                              </span>
                              <button
                                onClick={() => window.print()}
                                className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]"
                                title="Imprimir"
                              >
                                <Printer size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-7 text-center text-[12px] text-[#aaa5b6]">
                    Nenhuma nota fiscal encontrada com os filtros aplicados.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CUSTOS TAB */}
          {activeTab === "custos" && (
            <div className="space-y-5">
              {/* Search */}
              <div className="rounded-[18px] border border-[#ebe7f0] bg-white p-4 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome do produto..."
                    className="h-9 w-full rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                  />
                </div>
              </div>

              {/* Cost summary */}
              <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-[17px] font-bold text-[#423b65]">Custos por Produto</h2>
                  <span className="text-[11px] text-[#aaa5b6]">{filteredFichas.length} produto(s)</span>
                </div>
                {filteredFichas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-[#ebe7f0] bg-[#faf9ff]">
                          <th className="px-3 py-2.5 font-semibold text-[#625b77]">Produto</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Custo Total</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Vlr. Cardápio</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Lucro Bruto</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Mark Up</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFichas.map((ficha) => (
                          <tr key={ficha.id} className="border-b border-[#f0edf4] last:border-0">
                            <td className="px-3 py-3 font-medium text-[#514a6e]">{ficha.product_name}</td>
                            <td className="px-3 py-3 text-right text-[#625b77]">{formatCurrency(ficha.total_cost)}</td>
                            <td className="px-3 py-3 text-right text-[#625b77]">{formatCurrency(ficha.cardapio_price)}</td>
                            <td
                              className={`px-3 py-3 text-right font-semibold ${
                                ficha.gross_profit >= 0 ? "text-[#2e7d32]" : "text-[#b85f4a]"
                              }`}
                            >
                              {formatCurrency(ficha.gross_profit)}
                            </td>
                            <td className="px-3 py-3 text-right text-[#625b77]">{ficha.mark_up.toFixed(1)}%</td>
                            <td className="px-3 py-3 text-right">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ficha.status === "aprovado"
                                    ? "bg-[#e8f5e9] text-[#2e7d32]"
                                    : ficha.status === "arquivado"
                                    ? "bg-[#f5f5f5] text-[#918ba2]"
                                    : "bg-[#fff3e0] text-[#ef6c00]"
                                }`}
                              >
                                {ficha.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-7 text-center text-[12px] text-[#aaa5b6]">
                    Nenhum produto encontrado.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
