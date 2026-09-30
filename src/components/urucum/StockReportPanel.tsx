import { useEffect, useState } from "react";
import { Calendar, Download, Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type StockEntry = {
  id: string;
  invoice_id: string;
  purchase_order_id: string;
  supplier_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
};

type Item = { id: string; name: string };
type Supplier = { id: string; name: string };

export function StockReportPanel() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const canViewReports = hasRole("gerencia") || hasRole("compras");

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError("");

    const [itemsResult, suppliersResult, entriesResult] = await Promise.all([
      supabase.from("items").select("id,name").order("name"),
      supabase.from("suppliers").select("id,name").order("name"),
      supabase.from("stock_entries").select("id,invoice_id,purchase_order_id,supplier_id,item_id,quantity,created_at").order("created_at", { ascending: false }),
    ]);

    if (itemsResult.error) setError(itemsResult.error.message);
    if (suppliersResult.error) setError(suppliersResult.error.message);
    if (entriesResult.error) setError(entriesResult.error.message);

    setItems(itemsResult.data ?? []);
    setSuppliers(suppliersResult.data ?? []);
    setStockEntries(entriesResult.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const itemName = (id: string) => items.find((item) => item.id === id)?.name ?? "Item desconhecido";
  const supplierName = (id: string) => suppliers.find((supplier) => supplier.id === id)?.name ?? "Fornecedor desconhecido";

  const filteredEntries = stockEntries.filter((entry) => {
    const entryDate = new Date(entry.created_at);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    if (fromDate && entryDate < fromDate) return false;
    if (toDate && entryDate > toDate) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        itemName(entry.item_id).toLowerCase().includes(searchLower) ||
        supplierName(entry.supplier_id).toLowerCase().includes(searchLower) ||
        entry.invoice_id.includes(searchTerm)
      );
    }

    return true;
  });

  const totalQuantity = filteredEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);
  const totalValue = filteredEntries.reduce((sum, entry) => {
    const item = items.find((i) => i.id === entry.item_id);
    return sum + (item ? Number(entry.quantity) * 1 : sum);
  }, 0);

  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const exportToCSV = () => {
    const header = "ID,Data,Item,Fornecedor,Quantidade,NF,PO";
    const rows = filteredEntries.map((entry) => {
      const date = new Date(entry.created_at).toLocaleDateString("pt-BR");
      return [
        entry.id,
        date,
        `"${itemName(entry.item_id)}"`,
        `"${supplierName(entry.supplier_id)}"`,
        entry.quantity,
        entry.invoice_id,
        entry.purchase_order_id,
      ].join(",");
    });
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `estoque-relatorio-${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  if (!canViewReports) {
    return (
      <section className="mx-auto w-full max-w-[1050px] py-7">
        <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <p className="text-[13px] text-[#8d879d]">Acesso negado. Apenas Gerência e Compras podem visualizar relatórios de estoque.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-6">
        <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Relatório de Entradas de Estoque</h1>
        <p className="mt-2 text-[13px] text-[#8d879d]">Visualize e exporte todas as entradas de estoque registradas por nota fiscal.</p>
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">{error}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <div className="rounded-[14px] border border-[#ebe7f0] bg-white p-4 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa5b6]">Total de Itens</p>
          <p className="mt-1 text-[24px] font-bold text-[#423b65]">{filteredEntries.length}</p>
        </div>
        <div className="rounded-[14px] border border-[#ebe7f0] bg-white p-4 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa5b6]">Quantidade Total</p>
          <p className="mt-1 text-[24px] font-bold text-[#423b65]">{totalQuantity.toLocaleString()}</p>
        </div>
        <div className="rounded-[14px] border border-[#ebe7f0] bg-white p-4 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa5b6]">Período</p>
          <p className="mt-1 text-[14px] font-semibold text-[#423b65]">
            {dateFrom ? new Date(dateFrom).toLocaleDateString("pt-BR") : "Desde o início"}
            {" - "}
            {dateTo ? new Date(dateTo).toLocaleDateString("pt-BR") : "Até hoje"}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#ebe7f0] bg-white p-4 shadow-[0_7px_20px_rgba(77,64,120,0.04)] flex items-end">
          <button
            onClick={exportToCSV}
            disabled={filteredEntries.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d5df5] px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6] disabled:text-[#aaa4c2]"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#aaa5b6]" />
          <label className="text-[12px] text-[#625b77]">
            Período:
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="ml-2 h-9 rounded-[8px] border border-[#e5e1ee] bg-white px-2 text-[11px]"
            />
            {" até "}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="ml-2 h-9 rounded-[8px] border border-[#e5e1ee] bg-white px-2 text-[11px]"
            />
          </label>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
          <input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por item ou fornecedor..."
            className="h-9 w-64 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center text-sm text-[#918ba2]">Carregando entradas de estoque…</div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <p className="text-center text-[13px] text-[#aaa5b6]">Nenhuma entrada de estoque encontrada para o período selecionado.</p>
        </div>
      ) : (
        <div className="rounded-[20px] border border-[#ebe7f0] bg-white shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ebe7f0] bg-[#f8f7fc]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#625b77]">Data</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#625b77]">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#625b77]">Fornecedor</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#625b77]">Qtd</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#625b77]">NF</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#625b77]">PO</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#f0edf4] last:border-b-0 hover:bg-[#fbfafc]">
                    <td className="px-4 py-3 text-[12px] text-[#514a6e]">{new Date(entry.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-[12px] text-[#514a6e]">{itemName(entry.item_id)}</td>
                    <td className="px-4 py-3 text-[12px] text-[#514a6e]">{supplierName(entry.supplier_id)}</td>
                    <td className="px-4 py-3 text-right text-[12px] font-mono text-[#423b65]">{entry.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[#625b77]">{entry.invoice_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[#625b77]">{entry.purchase_order_id.slice(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[#ebe7f0] bg-[#f8f7fc] px-4 py-3">
              <p className="text-[11px] text-[#aaa5b6]">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#aaa5b6] hover:bg-[#f5f3ff] disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#aaa5b6] hover:bg-[#f5f3ff] disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}