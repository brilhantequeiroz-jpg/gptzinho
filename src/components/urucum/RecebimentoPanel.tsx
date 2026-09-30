import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileCheck2,
  PackageCheck,
  Plus,
  Printer,
  ShoppingCart,
  TriangleAlert,
  X,
  Download,
  Calendar,
  Filter,
  Edit3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type TabKey = "recebimento" | "nf";

type Item = { id: string; name: string };
type Supplier = { id: string; name: string };
type Order = { id: string; request_id: string; supplier_id: string | null; supplier_name: string; decided_at: string };
type OrderItem = { id: string; purchase_order_id: string; request_item_id: string; item_id: string; requested_quantity: number; decided_quantity: number };
type ReceiptCheck = { id: string; purchase_order_id: string };
type Invoice = { id: string; purchase_order_id: string; supplier_id: string | null; supplier_name: string; reference: string; launched_at: string };
type InvoiceItem = { id: string; invoice_id: string; item_id: string; quantity: number };
type Confirmation = { invoice_id: string; confirmed_at: string };
type StockEntry = { id: string; invoice_id: string; purchase_order_id: string; supplier_id: string; item_id: string; quantity: number; created_at: string };

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "recebimento", label: "Conferência de Recebimento", icon: ClipboardCheck },
  { key: "nf", label: "Cadastro de NF", icon: FileCheck2 },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function RecebimentoPanel() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [activeTab, setActiveTab] = useState<TabKey>("recebimento");
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [checks, setChecks] = useState<ReceiptCheck[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkOrder, setCheckOrder] = useState<string | null>(null);
  const [checkQuantities, setCheckQuantities] = useState<Record<string, string>>({});
  const [invoiceOrder, setInvoiceOrder] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ supplierId: "", supplierName: "", reference: "" });
  const [invoiceQuantities, setInvoiceQuantities] = useState<Record<string, string>>({});
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showDetailedCheck, setShowDetailedCheck] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [invoiceEditQuantities, setInvoiceEditQuantities] = useState<Record<string, string>>({});
  const [stockDateFrom, setStockDateFrom] = useState<string>("");
  const [stockDateTo, setStockDateTo] = useState<string>("");

  const itemName = (id: string) => items.find((item) => item.id === id)?.name ?? "Item pendente de cadastro";
  const orderItemsFor = (orderId: string) => orderItems.filter((item) => item.purchase_order_id === orderId);
  const invoiceItemsFor = (invoiceId: string) => invoiceItems.filter((item) => item.invoice_id === invoiceId);

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const results = await Promise.all([
      supabase.from("items").select("id,name").order("name"),
      supabase.from("suppliers").select("id,name").order("name"),
      supabase.from("purchase_orders").select("id,request_id,supplier_id,supplier_name,decided_at").order("decided_at", { ascending: false }),
      supabase.from("purchase_order_items").select("id,purchase_order_id,request_item_id,item_id,requested_quantity,decided_quantity"),
      supabase.from("receipt_checks").select("id,purchase_order_id"),
      supabase.from("invoices").select("id,purchase_order_id,supplier_id,supplier_name,reference,launched_at").order("launched_at", { ascending: false }),
      supabase.from("invoice_items").select("id,invoice_id,item_id,quantity"),
      supabase.from("receipt_confirmations").select("invoice_id,confirmed_at"),
      supabase.from("stock_entries").select("id,invoice_id,purchase_order_id,supplier_id,item_id,quantity,created_at").order("created_at", { ascending: false }),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
    setItems(results[0].data ?? []);
    setSuppliers(results[1].data ?? []);
    setOrders(results[2].data ?? []);
    setOrderItems(results[3].data ?? []);
    setChecks(results[4].data ?? []);
    setInvoices(results[5].data ?? []);
    setInvoiceItems(results[6].data ?? []);
    setConfirmations(results[7].data ?? []);
    setStockEntries(results[8].data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const pendingOrders = useMemo(() => {
    let filtered = orders.filter((order) => !invoices.some((invoice) => invoice.purchase_order_id === order.id));
    if (filterSupplier) filtered = filtered.filter((order) => order.supplier_id === filterSupplier);
    return filtered;
  }, [orders, invoices, filterSupplier]);

  const pendingInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => !confirmations.some((confirmation) => confirmation.invoice_id === invoice.id));
    if (filterSupplier) filtered = filtered.filter((invoice) => invoice.supplier_id === filterSupplier);
    return filtered;
  }, [invoices, confirmations, filterSupplier]);

  const stockEntriesFiltered = useMemo(() => {
    let filtered = stockEntries;
    if (stockDateFrom) filtered = filtered.filter((entry) => entry.created_at >= stockDateFrom + "T00:00:00.000Z");
    if (stockDateTo) filtered = filtered.filter((entry) => entry.created_at <= stockDateTo + "T23:59:59.999Z");
    return filtered;
  }, [stockEntries, stockDateFrom, stockDateTo]);

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      await refresh();
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setBusy(false);
    }
  };

  const registerCheck = async (orderId: string) => {
    if (!session?.user.id) return;
    const selectedItems = orderItemsFor(orderId).map((item) => ({ purchase_order_item_id: item.id, received_quantity: Number(checkQuantities[item.id]) }));
    if (selectedItems.some((item) => !checkQuantities[item.purchase_order_item_id])) return;
    await run(async () => {
      const { error: rpcError } = await supabase.rpc("register_receipt_check", { p_purchase_order_id: orderId, p_checked_by: session.user.id, p_items: selectedItems });
      if (rpcError) throw rpcError;
      setCheckOrder(null);
      setCheckQuantities({});
      setShowDetailedCheck(null);
    });
  };

  const launchInvoice = async (orderId: string) => {
    if (!session?.user.id) return;
    const selectedItems = orderItemsFor(orderId).map((orderItem) => ({ item_id: orderItem.item_id, quantity: Number(invoiceQuantities[orderItem.item_id]) }));
    if (!invoiceForm.reference || !invoiceForm.supplierName || selectedItems.some((item) => !invoiceQuantities[item.item_id])) return;
    await run(async () => {
      const { error: rpcError } = await supabase.rpc("launch_invoice", { p_purchase_order_id: orderId, p_launched_by: session.user.id, p_supplier_id: invoiceForm.supplierId || null, p_supplier_name: invoiceForm.supplierName, p_reference: invoiceForm.reference, p_items: selectedItems });
      if (rpcError) throw rpcError;
      setInvoiceOrder(null);
      setInvoiceForm({ supplierId: "", supplierName: "", reference: "" });
      setInvoiceQuantities({});
    });
  };

  const confirm = async (invoiceId: string) => {
    if (!session?.user.id) return;
    await run(async () => {
      const { error: rpcError } = await supabase.rpc("confirm_receipt", { p_invoice_id: invoiceId, p_confirmed_by: session.user.id });
      if (rpcError) throw rpcError;
    });
  };

  const startInvoiceEdit = (invoiceId: string) => {
    setEditingInvoice(invoiceId);
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    const items = invoiceItemsFor(invoiceId);
    setInvoiceEditQuantities(Object.fromEntries(items.map((item) => [item.item_id, item.quantity.toString()])));
  };

  const saveInvoiceEdit = async (invoiceId: string) => {
    if (!session?.user.id) return;
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const items = invoiceItemsFor(invoiceId);
    const updatedItems = items.map((item) => ({ id: item.id, quantity: Number(invoiceEditQuantities[item.item_id]) }));
    await run(async () => {
      for (const item of updatedItems) {
        const { error: rpcError } = await supabase.from("invoice_items").update({ quantity: item.quantity }).eq("id", item.id);
        if (rpcError) throw rpcError;
      }
      setEditingInvoice(null);
      setInvoiceEditQuantities({});
    });
  };

  const exportCheckData = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const items = orderItemsFor(orderId);
    const checkData = {
      order_id: orderId,
      request_id: order?.request_id,
      supplier_name: order?.supplier_name,
      decided_at: order?.decided_at,
      items: items.map((item) => ({
        item_id: item.item_id,
        item_name: itemName(item.item_id),
        requested_quantity: item.requested_quantity,
        decided_quantity: item.decided_quantity,
        received_quantity: checkQuantities[item.id] || "0",
      })),
      checked_by: session?.user?.email,
      checked_at: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(checkData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportName = `conferencia-recebimento-${orderId}-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  const roleNotice = (role: string) => rolesLoading ? "Verificando autoridade…" : hasRole(role) ? "" : "Autoridade pendente de atribuição.";

  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · RECEBIMENTO / NF</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Conferência de Recebimento e Cadastro de NF</h1>
          <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#8d879d]">Gerencie a conferência física e o lançamento de notas fiscais para pedidos aprovados.</p>
        </div>
        <div className="rounded-[14px] border border-[#e9e5f0] bg-white px-4 py-3 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
          Pendente de definições adicionais fora deste ciclo
        </div>
      </div>

      <div className="mb-6 grid gap-2 rounded-[18px] border border-[#ebe7f0] bg-white p-2 shadow-[0_7px_20px_rgba(77,64,120,0.04)] sm:grid-cols-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center justify-center gap-2 rounded-[13px] px-3 py-3 text-[11px] font-semibold transition ${activeTab === key ? "bg-[#6d5df5] text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)]" : "text-[#817a95] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">{error}</div>}
      {loading ? <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center text-sm text-[#918ba2]">Carregando registros…</div> : (
        <div className="space-y-5">
          {activeTab === "recebimento" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <CycleMetric label="Pedidos" value={orders.length} />
                <CycleMetric label="Conferências opcionais" value={checks.length} />
                <CycleMetric label="Notas Fiscais" value={invoices.length} />
              </div>
              <AuthorityNotice text={hasRole("compras") || hasRole("gerencia") ? "A conferência física é opcional e não impede o lançamento da NF. A confirmação permanece exclusiva da Gerência." : "Autoridades de Compras e Gerência pendentes de atribuição."} />

              <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <h2 className="font-display text-[17px] font-bold text-[#423b65]">Pedidos pendentes de NF</h2>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Filter size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                      <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]">
                        <option value="">Todos os fornecedores</option>
                        {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]">
                        <option value="">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="conferido">Conferido</option>
                        <option value="nf-lancada">NF lançada</option>
                      </select>
                    </div>
                  </div>
                </div>
                {pendingOrders.map((order) => {
                  const orderHasCheck = checks.some((check) => check.purchase_order_id === order.id);
                  return (
                    <div key={order.id} className="rounded-[15px] border border-[#ebe7f0] bg-[#fbfafc] p-4 transition hover:bg-white">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="flex-1">
                          <h3 className="font-display text-[15px] font-bold text-[#423b65]">Pedido · {order.supplier_name}</h3>
                          <p className="mt-1 text-[12px] text-[#a09aaa]">{orderItemsFor(order.id).map((item) => `${itemName(item.item_id)} · comprado ${item.decided_quantity}`).join(" | ")}</p>
                          <p className="mt-1 text-[10px] text-[#b4aebe]">Decidido em: {formatDate(order.decided_at)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {hasRole("compras") && !orderHasCheck && (
                            <button onClick={() => { setCheckOrder(order.id); setCheckQuantities(Object.fromEntries(orderItemsFor(order.id).map((item) => [item.id, ""]))); }} className="flex items-center gap-1 rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]"><ClipboardCheck size={14} /> Conferir</button>
                          )}
                          {hasRole("compras") && (
                            <button onClick={() => { const supplier = suppliers.find((item) => item.id === order.supplier_id); setInvoiceOrder(order.id); setInvoiceForm({ supplierId: order.supplier_id ?? "", supplierName: supplier?.name ?? order.supplier_name, reference: "" }); setInvoiceQuantities(Object.fromEntries(orderItemsFor(order.id).map((item) => [item.item_id, ""]))); }} className="flex items-center gap-1 rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]"><Plus size={14} /> Lancar NF</button>
                          )}
                          {orderHasCheck && (
                            <button onClick={() => setShowDetailedCheck(order.id)} className="flex items-center gap-1 rounded-lg bg-[#e8f5e9] px-3 py-2 text-[11px] font-semibold text-[#2e7d32]"><FileCheck2 size={14} /> Ver ficha</button>
                          )}
                        </div>
                      </div>
                      {showDetailedCheck === order.id && (
                                              <div className="mt-4 rounded-[12px] border border-[#e9e5f0] bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                  <h4 className="font-display text-[14px] font-bold text-[#423b65]">Ficha de Conferência Detalhada</h4>
                                                  <button onClick={() => setShowDetailedCheck(null)} className="rounded-lg p-1.5 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"><X size={16} /></button>
                                                </div>
                                                <DetailedCheckForm orderId={order.id} items={orderItemsFor(order.id)} itemName={itemName} quantities={checkQuantities} setQuantities={setCheckQuantities} onCancel={() => setShowDetailedCheck(null)} onSubmit={() => registerCheck(order.id)} busy={busy} onExport={() => exportCheckData(order.id)} checkedBy={session?.user?.email ?? "Usuário"} />
                                              </div>
                                            )}
                      {checkOrder === order.id && !showDetailedCheck && <CheckForm items={orderItemsFor(order.id)} itemName={itemName} quantities={checkQuantities} setQuantities={setCheckQuantities} onCancel={() => setCheckOrder(null)} onSubmit={() => registerCheck(order.id)} busy={busy} />}
                      {invoiceOrder === order.id && <InvoiceForm items={orderItemsFor(order.id)} itemName={itemName} suppliers={suppliers} form={invoiceForm} setForm={setInvoiceForm} quantities={invoiceQuantities} setQuantities={setInvoiceQuantities} onCancel={() => setInvoiceOrder(null)} onSubmit={() => launchInvoice(order.id)} busy={busy} />}
                    </div>
                  );
                })}
                <div className="space-y-4">
                  <RecordList title="Notas Fiscais sem confirmação registrada" empty="Nenhuma NF sem confirmação registrada." items={pendingInvoices.map((invoice) => ({ id: invoice.id, title: invoice.reference, meta: `${invoice.supplier_name} · ${invoiceItemsFor(invoice.id).map((item) => `${itemName(item.item_id)} · ${item.quantity}`).join(" | ")}`, time: formatDate(invoice.launched_at), action: hasRole("gerencia") ? <button onClick={() => confirm(invoice.id)} disabled={busy} className="flex items-center gap-1 rounded-lg bg-[#6d5df5] px-3 py-2 text-[11px] font-semibold text-white"><CheckCircle size={14} /> Confirmar</button> : null }))} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "nf" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <CycleMetric label="Pedidos" value={orders.length} />
                <CycleMetric label="Notas Fiscais" value={invoices.length} />
                <CycleMetric label="Confirmados" value={confirmations.length} />
              </div>
              <AuthorityNotice text={hasRole("compras") || hasRole("gerencia") ? "Lançamento de NF exclusivo de Compras; confirmação exclusiva de Gerência." : "Autoridades de Compras e Gerência pendentes de atribuição."} />
              {pendingOrders.map((order) => {
                const orderHasInvoice = invoices.some((invoice) => invoice.purchase_order_id === order.id);
                return (
                  <div key={order.id} className="rounded-[15px] border border-[#ebe7f0] bg-[#fbfafc] p-4 transition hover:bg-white">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex-1">
                        <h3 className="font-display text-[15px] font-bold text-[#423b65]">Pedido · {order.supplier_name}</h3>
                        <p className="mt-1 text-[12px] text-[#a09aaa]">{orderItemsFor(order.id).map((item) => `${itemName(item.item_id)} · comprado ${item.decided_quantity}`).join(" | ")}</p>
                        <p className="mt-1 text-[10px] text-[#b4aebe]">Decidido em: {formatDate(order.decided_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasRole("compras") && !orderHasInvoice && (
                          <button onClick={() => { const supplier = suppliers.find((item) => item.id === order.supplier_id); setInvoiceOrder(order.id); setInvoiceForm({ supplierId: order.supplier_id ?? "", supplierName: supplier?.name ?? order.supplier_name, reference: "" }); setInvoiceQuantities(Object.fromEntries(orderItemsFor(order.id).map((item) => [item.item_id, ""]))); }} className="flex items-center gap-1 rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]"><Plus size={14} /> Lancar NF</button>
                        )}
                        {invoices.some((inv) => inv.purchase_order_id === order.id) && (
                          <button onClick={() => { const invoice = invoices.find((inv) => inv.purchase_order_id === order.id); if (invoice) startInvoiceEdit(invoice.id); }} className="flex items-center gap-1 rounded-lg bg-[#fff3e0] px-3 py-2 text-[11px] font-semibold text-[#ef6c00]"><Edit3 size={14} /> Editar NF</button>
                        )}
                      </div>
                    </div>
                    {invoiceOrder === order.id && <InvoiceForm items={orderItemsFor(order.id)} itemName={itemName} suppliers={suppliers} form={invoiceForm} setForm={setInvoiceForm} quantities={invoiceQuantities} setQuantities={setInvoiceQuantities} onCancel={() => setInvoiceOrder(null)} onSubmit={() => launchInvoice(order.id)} busy={busy} />}
                    {editingInvoice && invoices.find((inv) => inv.id === editingInvoice) && (
                      <div className="mt-4 rounded-[12px] border border-[#e9e5f0] bg-white p-4">
                        <h4 className="font-display text-[14px] font-bold text-[#423b65]">Editar Quantidades da NF</h4>
                        <div className="mt-3 space-y-2">
                          {invoiceItemsFor(editingInvoice).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4">
                              <span className="text-[12px] text-[#625b77]">{itemName(item.item_id)}</span>
                              <input type="number" value={invoiceEditQuantities[item.item_id] || ""} onChange={(e) => setInvoiceEditQuantities({ ...invoiceEditQuantities, [item.item_id]: e.target.value })} placeholder="Quantidade" className="h-8 w-24 rounded-[8px] border border-[#e5e1ee] bg-white px-2 text-right text-[12px]" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => saveInvoiceEdit(editingInvoice)} disabled={busy} className="flex items-center gap-1 rounded-lg bg-[#6d5df5] px-3 py-2 text-[11px] font-semibold text-white"><CheckCircle size={14} /> Salvar</button>
                          <button onClick={() => setEditingInvoice(null)} className="flex items-center gap-1 rounded-lg bg-[#f5f5f5] px-3 py-2 text-[11px] text-[#918ba2]"><X size={14} /> Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <RecordList title="Notas Fiscais lançadas" empty="Nenhuma NF lançada." items={invoices.map((invoice) => ({ id: invoice.id, title: invoice.reference, meta: `${invoice.supplier_name} · ${invoiceItemsFor(invoice.id).map((item) => `${itemName(item.item_id)} · ${item.quantity}`).join(" | ")}`, time: formatDate(invoice.launched_at), action: hasRole("gerencia") ? <button onClick={() => confirm(invoice.id)} disabled={busy} className="flex items-center gap-1 rounded-lg bg-[#6d5df5] px-3 py-2 text-[11px] font-semibold text-white"><CheckCircle size={14} /> Confirmar</button> : null }))} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AuthorityNotice({ text }: { text: string }) {
  if (!text) return null;
  return <div className="flex items-center gap-2 rounded-[14px] border border-[#f2dfad] bg-[#fff9e9] px-4 py-3 text-[12px] text-[#957327]"><TriangleAlert size={15} />{text}</div>;
}

function CycleMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[17px] border border-[#ebe7f0] bg-white p-4 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa5b6]">{label}</p><p className="mt-2 font-display text-2xl font-bold text-[#423b65]">{value}</p></div>;
}

type RecordListItem = { id: string; title: string; meta: string; time: string; action?: React.ReactNode };
function RecordList({ title, empty, items }: { title: string; empty: string; items: RecordListItem[] }) {
  return <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-[17px] font-bold text-[#423b65]">{title}</h2><span className="text-[11px] text-[#aaa5b6]">{items.length} registro(s)</span></div>{items.length ? <div className="divide-y divide-[#f0edf4]">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#514a6e]">{item.title}</p><p className="mt-1 text-[11px] leading-5 text-[#918ba2]">{item.meta}</p><p className="mt-1 text-[10px] text-[#b4aebe]">{item.time}</p></div>{item.action}</div>)}</div> : <p className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-7 text-center text-[12px] text-[#aaa5b6]">{empty}</p>}</div>;
}

function DetailedCheckForm({ orderId, items, itemName, quantities, setQuantities, onCancel, onSubmit, busy, onExport, checkedBy }: { orderId: string; items: OrderItem[]; itemName: (id: string) => string; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean; onExport: () => void; checkedBy: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] bg-[#f8f7fc] p-4">
        <h5 className="text-[13px] font-bold text-[#423b65] mb-3">Dados do Pedido</h5>
        <div className="grid gap-2 text-[12px]">
          <div className="flex justify-between"><span className="text-[#aaa5b6]">ID do Pedido:</span> <span className="font-mono text-[#625b77]">{orderId}</span></div>
          <div className="flex justify-between"><span className="text-[#aaa5b6]">Data de decisão:</span> <span className="text-[#625b77]">{new Date().toLocaleDateString('pt-BR')}</span></div>
          <div className="flex justify-between"><span className="text-[#aaa5b6]">Conferido por:</span> <span className="text-[#625b77]">{checkedBy}</span></div>
        </div>
      </div>

      <div className="rounded-[12px] bg-[#f8f7fc] p-4">
        <h5 className="text-[13px] font-bold text-[#423b65] mb-3">Itens Conferidos</h5>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-2 rounded-[8px] bg-white border border-[#e9e5f0]">
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[#514a6e]">{itemName(item.item_id)}</p>
                <p className="text-[11px] text-[#aaa5b6]">Comprado: {item.decided_quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#aaa5b6]">Recebido:</span>
                <input type="number" step="any" value={quantities[item.id] ?? ""} onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })} placeholder="0" className="h-8 w-20 rounded-[8px] border border-[#e5e1ee] bg-white px-2 text-right text-[12px] font-mono" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onSubmit} disabled={busy} className="flex items-center gap-1 rounded-lg bg-[#6d5df5] px-3 py-2 text-[11px] font-semibold text-white"><CheckCircle size={14} /> Registrar Conferência</button>
        <button onClick={onExport} className="flex items-center gap-1 rounded-lg bg-[#e3f2fd] px-3 py-2 text-[11px] font-semibold text-[#1976d2]"><Download size={14} /> Exportar JSON</button>
        <button onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-[#f5f5f5] px-3 py-2 text-[11px] text-[#918ba2]"><X size={14} /> Cancelar</button>
      </div>
    </div>
  );
}

function CheckForm({ items, itemName, quantities, setQuantities, onCancel, onSubmit, busy }: { items: OrderItem[]; itemName: (id: string) => string; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  return <div className="mt-4 rounded-[15px] border border-[#e9e5f0] bg-[#fbfafc] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b82cf]">Conferência física opcional · item + quantidade</p><div className="mt-3 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 text-[12px] text-[#625b77]"><span>{itemName(item.item_id)} · comprado {item.decided_quantity}</span><input type="number" step="any" value={quantities[item.id] ?? ""} onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })} placeholder="Recebido" className="h-9 w-32 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-right" /></label>)}</div><div className="mt-3 flex gap-2"><button onClick={onSubmit} disabled={busy} className="h-9 rounded-[9px] bg-[#6d5df5] px-3 text-[11px] font-semibold text-white">Registrar conferência</button><button onClick={onCancel} className="h-9 rounded-[9px] px-3 text-[11px] text-[#918ba2]">Cancelar</button></div></div>;
}

function InvoiceForm({ items, itemName, suppliers, form, setForm, quantities, setQuantities, onCancel, onSubmit, busy }: { items: OrderItem[]; itemName: (id: string) => string; suppliers: Supplier[]; form: { supplierId: string; supplierName: string; reference: string }; setForm: (value: { supplierId: string; supplierName: string; reference: string }) => void; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  return <div className="mt-4 rounded-[15px] border border-[#e9e5f0] bg-[#fbfafc] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b82cf]">Lançamento da Nota Fiscal</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={form.supplierId} onChange={(e) => { const selected = suppliers.find((item) => item.id === e.target.value); setForm({ ...form, supplierId: e.target.value, supplierName: selected?.name ?? form.supplierName }); }} className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]"><option value="">Fornecedor ainda não cadastrado</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="Fornecedor da NF" className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]" /><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Referência da NF" className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]" /></div><div className="mt-3 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 text-[12px] text-[#625b77]"><span>{itemName(item.item_id)}</span><input type="number" step="any" value={quantities[item.item_id] ?? ""} onChange={(e) => setQuantities({ ...quantities, [item.item_id]: e.target.value })} placeholder="Quantidade NF" className="h-9 w-32 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-right" /></label>)}</div><p className="mt-3 text-[10px] leading-4 text-[#a09aaa]">A NF pode ser lançada antes do cadastro do fornecedor, mas a confirmação e o estoque exigem o fornecedor cadastrado.</p><div className="mt-3 flex gap-2"><button onClick={onSubmit} disabled={busy} className="h-9 rounded-[9px] bg-[#6d5df5] px-3 text-[11px] font-semibold text-white">Lançar NF</button><button onClick={onCancel} className="h-9 rounded-[9px] px-3 text-[11px] text-[#918ba2]">Cancelar</button></div></div>;
}
