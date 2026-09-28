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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type CycleFocus = "dashboard" | "pedidos" | "compras" | "estoque" | "fichas" | "financeiro" | "relatorios" | "cardapio";
type TabKey = "necessidades" | "solicitacoes" | "compras" | "recebimento" | "estoque";

type Item = { id: string; name: string };
type Supplier = { id: string; name: string };
type Need = { id: string; item_id: string; quantity: number; origin_sector: string; created_at: string };
type Request = { id: string; formalized_at: string };
type RequestItem = { id: string; request_id: string; need_id: string; item_id: string; requested_quantity: number };
type Order = { id: string; request_id: string; supplier_id: string | null; supplier_name: string; decided_at: string };
type OrderItem = { id: string; purchase_order_id: string; request_item_id: string; item_id: string; requested_quantity: number; decided_quantity: number };
type ReceiptCheck = { id: string; purchase_order_id: string };
type Invoice = { id: string; purchase_order_id: string; supplier_id: string | null; supplier_name: string; reference: string; launched_at: string };
type InvoiceItem = { id: string; invoice_id: string; item_id: string; quantity: number };
type Confirmation = { invoice_id: string; confirmed_at: string };
type StockEntry = { id: string; invoice_id: string; purchase_order_id: string; supplier_id: string; item_id: string; quantity: number; created_at: string };

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "necessidades", label: "Necessidade", icon: Plus },
  { key: "solicitacoes", label: "Solicitação", icon: ClipboardList },
  { key: "compras", label: "Decisão de compra", icon: ShoppingCart },
  { key: "recebimento", label: "Recebimento / NF", icon: FileCheck2 },
  { key: "estoque", label: "Estoque", icon: PackageCheck },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function Cycle01Panel({ focus }: { focus: CycleFocus }) {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [activeTab, setActiveTab] = useState<TabKey>(focus === "estoque" ? "estoque" : focus === "compras" ? "compras" : "necessidades");
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
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
  const [needForm, setNeedForm] = useState({ itemId: "", quantity: "", originSector: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "" });
  const [decisionOrder, setDecisionOrder] = useState<string | null>(null);
  const [decisionSupplier, setDecisionSupplier] = useState({ id: "", name: "" });
  const [decisionQuantities, setDecisionQuantities] = useState<Record<string, string>>({});
  const [checkOrder, setCheckOrder] = useState<string | null>(null);
  const [checkQuantities, setCheckQuantities] = useState<Record<string, string>>({});
  const [invoiceOrder, setInvoiceOrder] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ supplierId: "", supplierName: "", reference: "" });
  const [invoiceQuantities, setInvoiceQuantities] = useState<Record<string, string>>({});

  const itemName = (id: string) => items.find((item) => item.id === id)?.name ?? "Item pendente de cadastro";
  const requestFor = (requestId: string) => requests.find((request) => request.id === requestId);
  const requestItemsFor = (requestId: string) => requestItems.filter((item) => item.request_id === requestId);
  const orderItemsFor = (orderId: string) => orderItems.filter((item) => item.purchase_order_id === orderId);
  const invoiceItemsFor = (invoiceId: string) => invoiceItems.filter((item) => item.invoice_id === invoiceId);

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const results = await Promise.all([
      supabase.from("items").select("id,name").order("name"),
      supabase.from("suppliers").select("id,name").order("name"),
      supabase.from("purchase_needs").select("id,item_id,quantity,origin_sector,created_at").order("created_at", { ascending: false }),
      supabase.from("purchase_requests").select("id,formalized_at").order("formalized_at", { ascending: false }),
      supabase.from("purchase_request_items").select("id,request_id,need_id,item_id,requested_quantity"),
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
    setNeeds(results[2].data ?? []);
    setRequests(results[3].data ?? []);
    setRequestItems(results[4].data ?? []);
    setOrders(results[5].data ?? []);
    setOrderItems(results[6].data ?? []);
    setChecks(results[7].data ?? []);
    setInvoices(results[8].data ?? []);
    setInvoiceItems(results[9].data ?? []);
    setConfirmations(results[10].data ?? []);
    setStockEntries(results[11].data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  useEffect(() => {
    setActiveTab(focus === "estoque" ? "estoque" : focus === "compras" ? "compras" : "necessidades");
  }, [focus]);

  const pendingNeeds = useMemo(() => needs.filter((need) => !requestItems.some((requestItem) => requestItem.need_id === need.id)), [needs, requestItems]);
  const pendingRequests = useMemo(() => requests.filter((request) => !orders.some((order) => order.request_id === request.id)), [orders, requests]);
  const pendingOrders = useMemo(() => orders.filter((order) => !invoices.some((invoice) => invoice.purchase_order_id === order.id)), [invoices, orders]);
  const pendingInvoices = useMemo(() => invoices.filter((invoice) => !confirmations.some((confirmation) => confirmation.invoice_id === invoice.id)), [confirmations, invoices]);

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

  const createNeed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user.id || !needForm.itemId || !needForm.quantity || !needForm.originSector) return;
    await run(async () => {
      const { error: insertError } = await supabase.from("purchase_needs").insert({ item_id: needForm.itemId, quantity: Number(needForm.quantity), origin_sector: needForm.originSector, created_by: session.user.id });
      if (insertError) throw insertError;
      setNeedForm({ itemId: "", quantity: "", originSector: "" });
    });
  };

  const registerSupplier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user.id || !supplierForm.name.trim()) return;
    await run(async () => {
      const { error: insertError } = await supabase.from("suppliers").insert({ name: supplierForm.name.trim(), created_by: session.user.id });
      if (insertError) throw insertError;
      setSupplierForm({ name: "" });
    });
  };

  const formalize = async (needId: string) => {
    if (!session?.user.id) return;
    await run(async () => {
      const { error: rpcError } = await supabase.rpc("formalize_purchase_request", { p_need_id: needId, p_formalized_by: session.user.id });
      if (rpcError) throw rpcError;
    });
  };

  const decide = async (requestId: string) => {
    if (!session?.user.id) return;
    const selectedItems = requestItemsFor(requestId).map((item) => ({ request_item_id: item.id, decided_quantity: Number(decisionQuantities[item.id]) }));
    if (selectedItems.some((item) => !decisionQuantities[item.request_item_id])) return;
    await run(async () => {
      const { error: rpcError } = await supabase.rpc("decide_purchase", { p_request_id: requestId, p_decided_by: session.user.id, p_supplier_id: decisionSupplier.id || null, p_supplier_name: decisionSupplier.name, p_items: selectedItems });
      if (rpcError) throw rpcError;
      setDecisionOrder(null);
      setDecisionSupplier({ id: "", name: "" });
      setDecisionQuantities({});
    });
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

  const printList = (order: Order) => {
    window.print();
  };

  const roleNotice = (role: string) => rolesLoading ? "Verificando autoridade…" : hasRole(role) ? "" : "Autoridade pendente de atribuição.";

  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · CICLO 01</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Necessidade → Compra → Estoque</h1>
          <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#8d879d]">Acompanhe os registros do ciclo sem substituir fatos anteriores. As quantidades da necessidade, da decisão e da Nota Fiscal permanecem separadas.</p>
        </div>
        <div className="rounded-[14px] border border-[#e9e5f0] bg-white px-4 py-3 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
          Pendente de definições adicionais fora deste ciclo
        </div>
      </div>

      <div className="mb-6 grid gap-2 rounded-[18px] border border-[#ebe7f0] bg-white p-2 shadow-[0_7px_20px_rgba(77,64,120,0.04)] sm:grid-cols-5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center justify-center gap-2 rounded-[13px] px-3 py-3 text-[11px] font-semibold transition ${activeTab === key ? "bg-[#6d5df5] text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)]" : "text-[#817a95] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">{error}</div>}
      {loading ? <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center text-sm text-[#918ba2]">Carregando registros…</div> : (
        <div className="space-y-5">
          {activeTab === "necessidades" && (
            <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
              <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                <h2 className="font-display text-[17px] font-bold text-[#423b65]">Registrar necessidade</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#a09aaa]">Informe somente o que foi identificado pelo setor solicitante.</p>
                <form onSubmit={createNeed} className="mt-5 space-y-3">
                  <select value={needForm.itemId} onChange={(event) => setNeedForm({ ...needForm, itemId: event.target.value })} className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]" disabled={!items.length}>
                    <option value="">{items.length ? "Item" : "Nenhum item no Cadastro"}</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <input value={needForm.quantity} onChange={(event) => setNeedForm({ ...needForm, quantity: event.target.value })} type="number" step="any" placeholder="Quantidade informada" className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]" />
                  <input value={needForm.originSector} onChange={(event) => setNeedForm({ ...needForm, originSector: event.target.value })} placeholder="Origem / setor da solicitação" className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]" />
                  <button disabled={busy || !items.length} className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d5df5] text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6]"><Plus size={15} /> Registrar necessidade</button>
                </form>
                {!items.length && <p className="mt-4 text-[11px] leading-5 text-[#a09aaa]">A base referencial de Itens ainda não possui registros. O Cadastro permanece fora deste ciclo.</p>}
              </div>
              <RecordList title="Necessidades registradas" empty="Nenhuma necessidade registrada." items={needs.map((need) => ({ id: need.id, title: itemName(need.item_id), meta: `${need.quantity} · ${need.origin_sector}`, time: formatDate(need.created_at), action: pendingNeeds.some((pending) => pending.id === need.id) && hasRole("gerencia") ? <button onClick={() => formalize(need.id)} disabled={busy} className="rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] hover:bg-[#e6e2ff]">Formalizar</button> : null }))} />
            </div>
          )}

          {activeTab === "solicitacoes" && (
            <div className="space-y-4">
              <AuthorityNotice text={roleNotice("gerencia")} />
              <RecordList title="Solicitações formalizadas" empty="Nenhuma solicitação formalizada." items={requests.map((request) => ({ id: request.id, title: `${requestItemsFor(request.id).length} item(ns)`, meta: requestItemsFor(request.id).map((item) => `${itemName(item.item_id)} · ${item.requested_quantity}`).join(" | "), time: formatDate(request.formalized_at) }))} />
            </div>
          )}

          {activeTab === "compras" && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                  <AuthorityNotice text={roleNotice("gerencia")} />
                  <RecordList title="Solicitações sem decisão registrada" empty="Nenhuma solicitação sem decisão registrada." items={pendingRequests.map((request) => ({ id: request.id, title: `Solicitação ${request.id.slice(0, 8)}`, meta: requestItemsFor(request.id).map((item) => `${itemName(item.item_id)} · solicitado ${item.requested_quantity}`).join(" | "), time: formatDate(request.formalized_at), action: hasRole("gerencia") ? <button onClick={() => { setDecisionOrder(request.id); setDecisionQuantities(Object.fromEntries(requestItemsFor(request.id).map((item) => [item.id, ""]))); }} className="rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] hover:bg-[#e6e2ff]">Decidir</button> : null }))} />
                </div>
                <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                  <h2 className="font-display text-[16px] font-bold text-[#423b65]">Cadastrar fornecedor</h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#a09aaa]">Disponível apenas para Compras ou Gerência. O cadastro não cria estoque.</p>
                  <form onSubmit={registerSupplier} className="mt-4 space-y-3">
                    <input value={supplierForm.name} onChange={(event) => setSupplierForm({ name: event.target.value })} placeholder="Nome do fornecedor" className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] outline-none focus:border-[#bdb5f7]" />
                    <button disabled={busy || (!hasRole("compras") && !hasRole("gerencia"))} className="h-11 w-full rounded-[12px] bg-[#423b65] text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#e7e3f6]">Cadastrar fornecedor</button>
                  </form>
                  <div className="mt-5 space-y-2 border-t border-[#eeeaf1] pt-4">{suppliers.length ? suppliers.map((supplier) => <div key={supplier.id} className="flex items-center justify-between text-[12px] text-[#625b77]"><span>{supplier.name}</span><span className="text-[10px] text-[#aaa5b6]">cadastrado</span></div>) : <p className="text-[11px] text-[#a09aaa]">Nenhum fornecedor cadastrado.</p>}</div>
                </div>
              </div>
              {decisionOrder && <DecisionForm requestId={decisionOrder} items={requestItemsFor(decisionOrder)} itemName={itemName} suppliers={suppliers} supplier={decisionSupplier} setSupplier={setDecisionSupplier} quantities={decisionQuantities} setQuantities={setDecisionQuantities} onCancel={() => setDecisionOrder(null)} onSubmit={() => decide(decisionOrder)} busy={busy} />}
              <RecordList title="Decisões registradas / listas de compras" empty="Nenhuma decisão registrada." items={orders.map((order) => ({ id: order.id, title: order.supplier_name, meta: orderItemsFor(order.id).map((item) => `${itemName(item.item_id)} · ${item.decided_quantity}`).join(" | "), time: formatDate(order.decided_at), action: <button onClick={() => printList(order)} className="flex items-center gap-1 rounded-lg bg-[#f5f3ff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]"><Printer size={13} /> Imprimir</button> }))} />
            </div>
          )}

          {activeTab === "recebimento" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <CycleMetric label="Pedidos" value={orders.length} />
                <CycleMetric label="Conferências" value={checks.length} />
                <CycleMetric label="Notas Fiscais" value={invoices.length} />
              </div>
              <AuthorityNotice text={hasRole("compras") || hasRole("gerencia") ? "Conferência e NF permanecem separadas da confirmação." : "Autoridades de Compras e Gerência pendentes de atribuição."} />
              {pendingOrders.map((order) => {
                const orderHasCheck = checks.some((check) => check.purchase_order_id === order.id);
                return (
                  <div key={order.id} className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="font-display text-[16px] font-bold text-[#423b65]">Pedido · {order.supplier_name}</h2>
                        <p className="mt-1 text-[12px] text-[#a09aaa]">{orderItemsFor(order.id).map((item) => `${itemName(item.item_id)} · comprado ${item.decided_quantity}`).join(" | ")}</p>
                      </div>
                      <div className="flex gap-2">
                        {hasRole("compras") && !orderHasCheck && (
                          <button onClick={() => { setCheckOrder(order.id); setCheckQuantities(Object.fromEntries(orderItemsFor(order.id).map((item) => [item.id, ""]))); }} className="rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]">Conferir item + quantidade</button>
                        )}
                        {hasRole("compras") && orderHasCheck && (
                          <button onClick={() => { const supplier = suppliers.find((item) => item.id === order.supplier_id); setInvoiceOrder(order.id); setInvoiceForm({ supplierId: order.supplier_id ?? "", supplierName: supplier?.name ?? order.supplier_name, reference: "" }); setInvoiceQuantities(Object.fromEntries(orderItemsFor(order.id).map((item) => [item.item_id, ""]))); }} className="rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]">Lançar NF</button>
                        )}
                      </div>
                    </div>
                    {checkOrder === order.id && <CheckForm items={orderItemsFor(order.id)} itemName={itemName} quantities={checkQuantities} setQuantities={setCheckQuantities} onCancel={() => setCheckOrder(null)} onSubmit={() => registerCheck(order.id)} busy={busy} />}
                    {invoiceOrder === order.id && <InvoiceForm items={orderItemsFor(order.id)} itemName={itemName} suppliers={suppliers} form={invoiceForm} setForm={setInvoiceForm} quantities={invoiceQuantities} setQuantities={setInvoiceQuantities} onCancel={() => setInvoiceOrder(null)} onSubmit={() => launchInvoice(order.id)} busy={busy} />}
                  </div>
                );
              })}
              <div className="space-y-4">
                <RecordList title="Notas Fiscais sem confirmação registrada" empty="Nenhuma NF sem confirmação registrada." items={pendingInvoices.map((invoice) => ({ id: invoice.id, title: invoice.reference, meta: `${invoice.supplier_name} · ${invoiceItemsFor(invoice.id).map((item) => `${itemName(item.item_id)} · ${item.quantity}`).join(" | ")}`, time: formatDate(invoice.launched_at), action: hasRole("gerencia") ? <button onClick={() => confirm(invoice.id)} disabled={busy} className="rounded-lg bg-[#6d5df5] px-3 py-2 text-[11px] font-semibold text-white">Confirmar recebimento</button> : null }))} />
              </div>
            </div>
          )}

          {activeTab === "estoque" && (
            <div className="space-y-5"><div className="rounded-[20px] border border-[#d8f0e4] bg-[#f2fbf7] px-5 py-4 text-[12px] leading-5 text-[#318464]">Entradas abaixo são criadas automaticamente somente pela confirmação de recebimento da Gerência e usam as quantidades da NF.</div><RecordList title="Entradas de estoque" empty="Nenhuma entrada automática registrada." items={stockEntries.map((entry) => ({ id: entry.id, title: itemName(entry.item_id), meta: `${entry.quantity} · rastreio: NF ${entry.invoice_id.slice(0, 8)} · fornecedor ${entry.supplier_id.slice(0, 8)} · pedido ${entry.purchase_order_id.slice(0, 8)}`, time: formatDate(entry.created_at), action: <button onClick={() => navigator.clipboard?.writeText(`Estoque ${entry.id} · NF ${entry.invoice_id} · Fornecedor ${entry.supplier_id} · Pedido ${entry.purchase_order_id}`)} className="flex items-center gap-1 rounded-lg bg-[#f5f3ff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5]"><Copy size={13} /> Copiar rastreio</button> }))} /></div>
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

function DecisionForm({ requestId, items, itemName, suppliers, supplier, setSupplier, quantities, setQuantities, onCancel, onSubmit, busy }: { requestId: string; items: RequestItem[]; itemName: (id: string) => string; suppliers: Supplier[]; supplier: { id: string; name: string }; setSupplier: (value: { id: string; name: string }) => void; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  return <div className="rounded-[20px] border border-[#dcd6ff] bg-[#faf9ff] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">Decisão registrada separadamente</p><h2 className="mt-1 font-display text-[17px] font-bold text-[#423b65]">Escolha fornecedor e quantidades</h2></div><button onClick={onCancel} className="text-[12px] text-[#918ba2]">Cancelar</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={supplier.id} onChange={(event) => { const selected = suppliers.find((item) => item.id === event.target.value); setSupplier({ id: event.target.value, name: selected?.name ?? supplier.name }); }} className="h-11 rounded-[12px] border border-[#e5e1ee] bg-white px-3 text-[12px] text-[#625b77]"><option value="">Fornecedor não cadastrado</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={supplier.name} onChange={(event) => setSupplier({ ...supplier, name: event.target.value })} placeholder="Fornecedor escolhido" className="h-11 rounded-[12px] border border-[#e5e1ee] bg-white px-3 text-[12px] text-[#625b77]" /></div><div className="mt-4 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 rounded-[12px] bg-white px-3 py-3 text-[12px] text-[#625b77]"><span>{itemName(item.item_id)} · solicitado {item.requested_quantity}</span><input type="number" step="any" value={quantities[item.id] ?? ""} onChange={(event) => setQuantities({ ...quantities, [item.id]: event.target.value })} placeholder="Quantidade decidida" className="h-9 w-40 rounded-[9px] border border-[#e5e1ee] px-2 text-right" /></label>)}</div><button onClick={onSubmit} disabled={busy} className="mt-4 h-10 rounded-[11px] bg-[#6d5df5] px-4 text-[12px] font-semibold text-white">Registrar decisão</button></div>;
}

function CheckForm({ items, itemName, quantities, setQuantities, onCancel, onSubmit, busy }: { items: OrderItem[]; itemName: (id: string) => string; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  return <div className="mt-4 rounded-[15px] border border-[#e9e5f0] bg-[#fbfafc] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b82cf]">Conferência restrita a item + quantidade</p><div className="mt-3 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 text-[12px] text-[#625b77]"><span>{itemName(item.item_id)} · comprado {item.decided_quantity}</span><input type="number" step="any" value={quantities[item.id] ?? ""} onChange={(event) => setQuantities({ ...quantities, [item.id]: event.target.value })} placeholder="Recebido" className="h-9 w-32 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-right" /></label>)}</div><div className="mt-3 flex gap-2"><button onClick={onSubmit} disabled={busy} className="h-9 rounded-[9px] bg-[#6d5df5] px-3 text-[11px] font-semibold text-white">Registrar conferência</button><button onClick={onCancel} className="h-9 rounded-[9px] px-3 text-[11px] text-[#918ba2]">Cancelar</button></div></div>;
}

function InvoiceForm({ items, itemName, suppliers, form, setForm, quantities, setQuantities, onCancel, onSubmit, busy }: { items: OrderItem[]; itemName: (id: string) => string; suppliers: Supplier[]; form: { supplierId: string; supplierName: string; reference: string }; setForm: (value: { supplierId: string; supplierName: string; reference: string }) => void; quantities: Record<string, string>; setQuantities: (value: Record<string, string>) => void; onCancel: () => void; onSubmit: () => void; busy: boolean }) {
  return <div className="mt-4 rounded-[15px] border border-[#e9e5f0] bg-[#fbfafc] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b82cf]">Lançamento da Nota Fiscal</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={form.supplierId} onChange={(event) => { const selected = suppliers.find((item) => item.id === event.target.value); setForm({ ...form, supplierId: event.target.value, supplierName: selected?.name ?? form.supplierName }); }} className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]"><option value="">Fornecedor ainda não cadastrado</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} placeholder="Fornecedor da NF" className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]" /><input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} placeholder="Referência da NF" className="h-10 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px]" /></div><div className="mt-3 space-y-2">{items.map((item) => <label key={item.id} className="flex items-center justify-between gap-4 text-[12px] text-[#625b77]"><span>{itemName(item.item_id)}</span><input type="number" step="any" value={quantities[item.item_id] ?? ""} onChange={(event) => setQuantities({ ...quantities, [item.item_id]: event.target.value })} placeholder="Quantidade NF" className="h-9 w-32 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-right" /></label>)}</div><p className="mt-3 text-[10px] leading-4 text-[#a09aaa]">A NF pode ser lançada antes do cadastro do fornecedor, mas a confirmação e o estoque exigem o fornecedor cadastrado.</p><div className="mt-3 flex gap-2"><button onClick={onSubmit} disabled={busy} className="h-9 rounded-[9px] bg-[#6d5df5] px-3 text-[11px] font-semibold text-white">Lançar NF</button><button onClick={onCancel} className="h-9 rounded-[9px] px-3 text-[11px] text-[#918ba2]">Cancelar</button></div></div>;
}
