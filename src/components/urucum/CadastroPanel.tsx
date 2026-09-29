import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Save, Search, ShieldCheck, Trash2, Truck, UsersRound, X, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type CadastroTab = "items" | "suppliers" | "employees";
type Item = { id: string; name: string; created_at: string };
type Supplier = {
  id: string;
  internal_code: number;
  name: string;
  legal_name: string | null;
  trade_name: string | null;
  document_number: string | null;
  state_registration: string | null;
  address: string | null;
  seller_name: string | null;
  categories: string[];
  delivery_days: string[];
  delivery_terms: string | null;
  payment_methods: string[];
  payment_term_days: number | null;
  boleto_email: string | null;
  bank_details: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  pix_key: string | null;
  budget_limit: number | null;
  budget_target: number | null;
  notes: string | null;
  created_at: string;
};
type Employee = { id: string; name: string; position: string; email: string | null; phone: string | null; active: boolean; created_at: string };
type SupplierContact = { id?: string; name: string; position: string; phone: string; email: string; is_primary: boolean };
type SupplierForm = {
  legalName: string;
  tradeName: string;
  documentNumber: string;
  stateRegistration: string;
  address: string;
  sellerName: string;
  categories: string;
  deliveryDays: string;
  deliveryTerms: string;
  paymentMethods: string;
  paymentTermDays: string;
  boletoEmail: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankDetails: string;
  pixKey: string;
  budgetLimit: string;
  budgetTarget: string;
  notes: string;
};

const tabs: { key: CadastroTab; label: string; icon: typeof Utensils }[] = [
  { key: "items", label: "Itens", icon: Utensils },
  { key: "suppliers", label: "Fornecedores", icon: Truck },
  { key: "employees", label: "Funcionários", icon: UsersRound },
];

const inputClass = "h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] text-[#625b77] outline-none transition placeholder:text-[#b0abba] focus:border-[#bdb5f7] focus:bg-white";
const emptySupplierForm: SupplierForm = { legalName: "", tradeName: "", documentNumber: "", stateRegistration: "", address: "", sellerName: "", categories: "", deliveryDays: "", deliveryTerms: "", paymentMethods: "", paymentTermDays: "", boletoEmail: "", bankName: "", bankBranch: "", bankAccount: "", bankDetails: "", pixKey: "", budgetLimit: "", budgetTarget: "", notes: "" };

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Não foi possível concluir o cadastro.";
}

function listFromText(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function textFromList(value: string[] | null | undefined) {
  return (value ?? []).join(", ");
}

export function CadastroPanel() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [activeTab, setActiveTab] = useState<CadastroTab>("items");
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [itemName, setItemName] = useState("");
  const [employeeForm, setEmployeeForm] = useState({ name: "", position: "", email: "", phone: "", active: true });
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm);
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>([]);
  const [supplierItemIds, setSupplierItemIds] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canManage = hasRole("gerencia");
  const canManageSuppliers = canManage || hasRole("compras");

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError("");
    const results = await Promise.all([
      supabase.from("items").select("id,name,created_at").order("name"),
      supabase.from("suppliers").select("id,internal_code,name,legal_name,trade_name,document_number,state_registration,address,seller_name,categories,delivery_days,delivery_terms,payment_methods,payment_term_days,boleto_email,bank_details,bank_name,bank_branch,bank_account,pix_key,budget_limit,budget_target,notes,created_at").order("name"),
      supabase.from("employees").select("id,name,position,email,phone,active,created_at").order("name"),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
    setItems(results[0].data ?? []);
    setSuppliers(results[1].data ?? []);
    setEmployees(results[2].data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const resetSupplier = () => {
    setSupplierForm(emptySupplierForm);
    setSupplierContacts([]);
    setSupplierItemIds([]);
    setEditingSupplierId(null);
  };

  const resetItem = () => {
    setItemName("");
    setEditingItemId(null);
  };

  const resetEmployee = () => {
    setEmployeeForm({ name: "", position: "", email: "", phone: "", active: true });
    setEditingEmployeeId(null);
  };

  const run = async (operation: () => Promise<void>, reset: () => void) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      reset();
      await refresh();
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setBusy(false);
    }
  };

  const submitItem = async (event: FormEvent) => {
    event.preventDefault();
    const name = itemName.trim();
    if (!canManage || !name) return;
    await run(async () => {
      const result = editingItemId ? await supabase.from("items").update({ name }).eq("id", editingItemId) : await supabase.from("items").insert({ name });
      if (result.error) throw result.error;
    }, resetItem);
  };

  const submitEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || !session?.user.id || !employeeForm.name.trim() || !employeeForm.position.trim()) return;
    const payload = { name: employeeForm.name.trim(), position: employeeForm.position.trim(), email: employeeForm.email.trim() || null, phone: employeeForm.phone.trim() || null, active: employeeForm.active };
    await run(async () => {
      const result = editingEmployeeId ? await supabase.from("employees").update(payload).eq("id", editingEmployeeId) : await supabase.from("employees").insert({ ...payload, created_by: session.user.id });
      if (result.error) throw result.error;
    }, resetEmployee);
  };

  const startSupplierEdit = async (supplier: Supplier) => {
    setBusy(true);
    setError("");
    const [contactsResult, itemsResult] = await Promise.all([
      supabase.from("supplier_contacts").select("id,name,position,phone,email,is_primary").eq("supplier_id", supplier.id).order("is_primary", { ascending: false }),
      supabase.from("supplier_items").select("item_id").eq("supplier_id", supplier.id),
    ]);
    if (contactsResult.error || itemsResult.error) {
      setError(contactsResult.error?.message ?? itemsResult.error?.message ?? "Não foi possível abrir o fornecedor.");
      setBusy(false);
      return;
    }
    setEditingSupplierId(supplier.id);
    setSupplierForm({ legalName: supplier.legal_name ?? "", tradeName: supplier.trade_name ?? supplier.name, documentNumber: supplier.document_number ?? "", stateRegistration: supplier.state_registration ?? "", address: supplier.address ?? "", sellerName: supplier.seller_name ?? "", categories: textFromList(supplier.categories), deliveryDays: textFromList(supplier.delivery_days), deliveryTerms: supplier.delivery_terms ?? "", paymentMethods: textFromList(supplier.payment_methods), paymentTermDays: supplier.payment_term_days?.toString() ?? "", boletoEmail: supplier.boleto_email ?? "", bankName: supplier.bank_name ?? "", bankBranch: supplier.bank_branch ?? "", bankAccount: supplier.bank_account ?? "", bankDetails: supplier.bank_details ?? "", pixKey: supplier.pix_key ?? "", budgetLimit: supplier.budget_limit?.toString() ?? "", budgetTarget: supplier.budget_target?.toString() ?? "", notes: supplier.notes ?? "" });
    setSupplierContacts((contactsResult.data ?? []).map((contact) => ({ id: contact.id, name: contact.name, position: contact.position ?? "", phone: contact.phone ?? "", email: contact.email ?? "", is_primary: contact.is_primary })));
    setSupplierItemIds((itemsResult.data ?? []).map((item) => item.item_id));
    setBusy(false);
  };

  const submitSupplier = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageSuppliers || !session?.user.id) return;
    const legalName = supplierForm.legalName.trim();
    const tradeName = supplierForm.tradeName.trim();
    if (!legalName || !tradeName || !supplierForm.documentNumber.trim() || !supplierForm.address.trim()) {
      setError("Razão social, nome fantasia, CNPJ/CPF e endereço são obrigatórios.");
      return;
    }
    const supplierPayload = { name: tradeName, legal_name: legalName, trade_name: tradeName, document_number: supplierForm.documentNumber.trim(), state_registration: supplierForm.stateRegistration.trim() || null, address: supplierForm.address.trim(), seller_name: supplierForm.sellerName.trim() || null, categories: listFromText(supplierForm.categories), delivery_days: listFromText(supplierForm.deliveryDays), delivery_terms: supplierForm.deliveryTerms.trim() || null, payment_methods: listFromText(supplierForm.paymentMethods), payment_term_days: supplierForm.paymentTermDays ? Number(supplierForm.paymentTermDays) : null, boleto_email: supplierForm.boletoEmail.trim() || null, bank_name: supplierForm.bankName.trim() || null, bank_branch: supplierForm.bankBranch.trim() || null, bank_account: supplierForm.bankAccount.trim() || null, bank_details: supplierForm.bankDetails.trim() || null, pix_key: supplierForm.pixKey.trim() || null, budget_limit: supplierForm.budgetLimit ? Number(supplierForm.budgetLimit) : null, budget_target: supplierForm.budgetTarget ? Number(supplierForm.budgetTarget) : null, notes: supplierForm.notes.trim() || null };
    await run(async () => {
      let supplierId = editingSupplierId;
      if (supplierId) {
        const result = await supabase.from("suppliers").update(supplierPayload).eq("id", supplierId);
        if (result.error) throw result.error;
      } else {
        const result = await supabase.from("suppliers").insert({ ...supplierPayload, created_by: session.user.id }).select("id").single();
        if (result.error) throw result.error;
        supplierId = result.data.id;
      }
      const contactsResult = await supabase.from("supplier_contacts").delete().eq("supplier_id", supplierId);
      if (contactsResult.error) throw contactsResult.error;
      const contacts = supplierContacts.filter((contact) => contact.name.trim()).map((contact, index) => ({ supplier_id: supplierId, name: contact.name.trim(), position: contact.position.trim() || null, phone: contact.phone.trim() || null, email: contact.email.trim() || null, is_primary: index === 0 || contact.is_primary }));
      if (contacts.length) {
        const result = await supabase.from("supplier_contacts").insert(contacts);
        if (result.error) throw result.error;
      }
      const linksResult = await supabase.from("supplier_items").delete().eq("supplier_id", supplierId);
      if (linksResult.error) throw linksResult.error;
      if (supplierItemIds.length) {
        const result = await supabase.from("supplier_items").insert(supplierItemIds.map((itemId) => ({ supplier_id: supplierId, item_id: itemId })));
        if (result.error) throw result.error;
      }
    }, resetSupplier);
  };

  const remove = async (table: "items" | "suppliers" | "employees", id: string, label: string, reset: () => void) => {
    if (!window.confirm(`Remover ${label}?`)) return;
    await run(async () => {
      const result = await supabase.from(table).delete().eq("id", id);
      if (result.error) throw result.error;
    }, reset);
  };

  const activeRecords = activeTab === "items" ? items : activeTab === "suppliers" ? suppliers : employees;
  const filteredRecords = activeRecords.filter((record) => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return true;
    if (activeTab === "employees") {
      const employee = record as Employee;
      return [employee.name, employee.position, employee.email, employee.phone].some((value) => value?.toLocaleLowerCase().includes(term));
    }
    if (activeTab === "suppliers") {
      const supplier = record as Supplier;
      return [supplier.name, supplier.legal_name, supplier.document_number, supplier.seller_name].some((value) => value?.toLocaleLowerCase().includes(term));
    }
    return record.name.toLocaleLowerCase().includes(term);
  });
  const activeTabInfo = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="mx-auto w-full max-w-[1120px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · BASE OPERACIONAL</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Cadastros</h1>
          <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-[#8d879d]">Alimente a operação com os registros que sustentam compras, estoque e a rotina da equipe.</p>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#e9e5f0] bg-white px-4 py-3 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]"><ShieldCheck size={15} className={canManage ? "text-[#42a77f]" : "text-[#f0a05a]"} />{rolesLoading ? "Verificando permissões…" : canManage ? "Gerência habilitada" : "Acesso de gestão pendente"}</div>
      </div>

      <div className="mb-6 grid gap-2 rounded-[18px] border border-[#ebe7f0] bg-white p-2 shadow-[0_7px_20px_rgba(77,64,120,0.04)] sm:grid-cols-3">
        {tabs.map(({ key, label, icon: Icon }) => {
          const count = key === "items" ? items.length : key === "suppliers" ? suppliers.length : employees.filter((employee) => employee.active).length;
          return <button key={key} onClick={() => { setActiveTab(key); setSearch(""); resetItem(); resetSupplier(); resetEmployee(); }} className={`flex items-center justify-between rounded-[13px] px-4 py-3 text-left transition ${activeTab === key ? "bg-[#6d5df5] text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)]" : "text-[#817a95] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"}`}><span className="flex items-center gap-2 text-[11px] font-semibold"><Icon size={15} />{label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === key ? "bg-white/20 text-white" : "bg-[#f4f2fb] text-[#918ba2]"}`}>{count}</span></button>;
        })}
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] leading-5 text-[#b85f4a]">{error}</div>}

      {activeTab === "suppliers" ? (
        <SupplierWorkspace suppliers={filteredRecords as Supplier[]} allCount={suppliers.length} items={items} form={supplierForm} setForm={setSupplierForm} contacts={supplierContacts} setContacts={setSupplierContacts} itemIds={supplierItemIds} setItemIds={setSupplierItemIds} editing={Boolean(editingSupplierId)} busy={busy} canManage={canManageSuppliers} search={search} setSearch={setSearch} loading={loading} onSubmit={submitSupplier} onEdit={startSupplierEdit} onRemove={(supplier) => remove("suppliers", supplier.id, supplier.name, resetSupplier)} onCancel={resetSupplier} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
          <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">{editingItemId || editingEmployeeId ? "Editar registro" : "Novo registro"}</p>
            <h2 className="mt-1 font-display text-[17px] font-bold text-[#423b65]">{editingItemId ? "Editar item" : editingEmployeeId ? "Editar funcionário" : `Cadastrar ${activeTabInfo.label.toLocaleLowerCase()}`}</h2>
            {activeTab === "items" && <form onSubmit={submitItem} className="mt-5 space-y-3"><input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Nome do item" className={inputClass} /><SubmitButton busy={busy} disabled={!canManage} editing={Boolean(editingItemId)} /><PermissionHint allowed={canManage} text="Somente a Gerência pode criar, editar ou remover itens." /></form>}
            {activeTab === "employees" && <form onSubmit={submitEmployee} className="mt-5 space-y-3"><input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} placeholder="Nome completo" className={inputClass} /><input value={employeeForm.position} onChange={(event) => setEmployeeForm({ ...employeeForm, position: event.target.value })} placeholder="Cargo / função" className={inputClass} /><input value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} type="email" placeholder="E-mail (opcional)" className={inputClass} /><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} placeholder="Telefone (opcional)" className={inputClass} /><label className="flex items-center gap-2 px-1 text-[12px] text-[#625b77]"><input type="checkbox" checked={employeeForm.active} onChange={(event) => setEmployeeForm({ ...employeeForm, active: event.target.checked })} className="h-4 w-4 accent-[#6d5df5]" /> Funcionário ativo</label><SubmitButton busy={busy} disabled={!canManage} editing={Boolean(editingEmployeeId)} /><PermissionHint allowed={canManage} text="Somente a Gerência pode gerenciar funcionários." /></form>}
          </div>
          <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-[17px] font-bold text-[#423b65]">{activeTabInfo.label} cadastrados</h2><p className="mt-1 text-[11px] text-[#aaa5b6]">{filteredRecords.length} de {activeRecords.length} registro(s)</p></div><label className="relative block sm:w-[220px]"><Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar" className={`${inputClass} pl-9`} /></label></div>{loading ? <EmptyState text="Carregando cadastros…" /> : filteredRecords.length ? <div className="divide-y divide-[#f0edf4]">{filteredRecords.map((record) => <CadastroRow key={record.id} type={activeTab} record={record} canEdit={canManage} onEdit={() => { if (activeTab === "items") { setEditingItemId(record.id); setItemName((record as Item).name); } else { setEditingEmployeeId(record.id); const employee = record as Employee; setEmployeeForm({ name: employee.name, position: employee.position, email: employee.email ?? "", phone: employee.phone ?? "", active: employee.active }); } }} onRemove={() => remove(activeTab === "items" ? "items" : "employees", record.id, record.name, activeTab === "items" ? resetItem : resetEmployee)} />)}</div> : <EmptyState text="Nenhum registro encontrado. Comece pelo formulário ao lado." />}</div>
        </div>
      )}
    </section>
  );
}

function SupplierWorkspace({ suppliers, allCount, items, form, setForm, contacts, setContacts, itemIds, setItemIds, editing, busy, canManage, search, setSearch, loading, onSubmit, onEdit, onRemove, onCancel }: { suppliers: Supplier[]; allCount: number; items: Item[]; form: SupplierForm; setForm: (value: SupplierForm) => void; contacts: SupplierContact[]; setContacts: (value: SupplierContact[]) => void; itemIds: string[]; setItemIds: (value: string[]) => void; editing: boolean; busy: boolean; canManage: boolean; search: string; setSearch: (value: string) => void; loading: boolean; onSubmit: (event: FormEvent) => void; onEdit: (supplier: Supplier) => void; onRemove: (supplier: Supplier) => void; onCancel: () => void }) {
  const update = (field: keyof SupplierForm, value: string) => setForm({ ...form, [field]: value });
  return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-[430px_1fr]">
    <form onSubmit={onSubmit} className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">{editing ? "Editar fornecedor" : "Novo fornecedor"}</p><h2 className="mt-1 font-display text-[17px] font-bold text-[#423b65]">Identificação e condições</h2></div>{editing && <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label="Cancelar edição"><X size={16} /></button>}</div><div className="mt-5 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><input required value={form.legalName} onChange={(event) => update("legalName", event.target.value)} placeholder="Razão social *" className={inputClass} /><input required value={form.tradeName} onChange={(event) => update("tradeName", event.target.value)} placeholder="Nome fantasia *" className={inputClass} /></div><div className="grid gap-3 sm:grid-cols-2"><input required value={form.documentNumber} onChange={(event) => update("documentNumber", event.target.value)} placeholder="CNPJ *" className={inputClass} /><input value={form.stateRegistration} onChange={(event) => update("stateRegistration", event.target.value)} placeholder="Inscrição estadual" className={inputClass} /></div><textarea required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Endereço completo *" rows={2} className="w-full resize-none rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 py-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]" /><div className="grid gap-3 sm:grid-cols-2"><input value={form.sellerName} onChange={(event) => update("sellerName", event.target.value)} placeholder="Vendedor(a) principal" className={inputClass} /><input value={form.categories} onChange={(event) => update("categories", event.target.value)} placeholder="Categorias (separe por vírgula)" className={inputClass} /></div><div className="grid gap-3 sm:grid-cols-2"><input value={form.deliveryDays} onChange={(event) => update("deliveryDays", event.target.value)} placeholder="Dias de entrega (vírgula)" className={inputClass} /><input value={form.deliveryTerms} onChange={(event) => update("deliveryTerms", event.target.value)} placeholder="Prazo / condições de entrega" className={inputClass} /></div><div className="grid gap-3 sm:grid-cols-2"><input value={form.paymentMethods} onChange={(event) => update("paymentMethods", event.target.value)} placeholder="Formas de pagamento (vírgula)" className={inputClass} /><input value={form.paymentTermDays} onChange={(event) => update("paymentTermDays", event.target.value)} type="number" min="0" placeholder="Prazo de pagamento (dias)" className={inputClass} /></div><input value={form.boletoEmail} onChange={(event) => update("boletoEmail", event.target.value)} type="email" placeholder="E-mail para boletos" className={inputClass} /><div className="grid gap-3 sm:grid-cols-2"><input value={form.bankDetails} onChange={(event) => update("bankDetails", event.target.value)} placeholder="Banco / agência / conta" className={inputClass} /><input value={form.pixKey} onChange={(event) => update("pixKey", event.target.value)} placeholder="Chave PIX" className={inputClass} /></div><div className="grid gap-3 sm:grid-cols-2"><input value={form.budgetLimit} onChange={(event) => update("budgetLimit", event.target.value)} type="number" min="0" step="0.01" placeholder="Limite de orçamento" className={inputClass} /><input value={form.budgetTarget} onChange={(event) => update("budgetTarget", event.target.value)} type="number" min="0" step="0.01" placeholder="Meta de orçamento" className={inputClass} /></div><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Observações" rows={2} className="w-full resize-none rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 py-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]" /><button type="submit" disabled={busy || !canManage} className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d5df5] text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6] disabled:text-[#aaa4c2]">{editing ? <Save size={15} /> : <Plus size={15} />}{busy ? "Salvando…" : editing ? "Salvar fornecedor" : "Cadastrar fornecedor"}</button>{!canManage && <p className="rounded-[11px] bg-[#fff9e9] px-3 py-2 text-[10px] leading-4 text-[#957327]">Gerência ou Compras podem cadastrar fornecedores; apenas Gerência administra o cadastro completo.</p>}</div></form>
    <div className="space-y-5"><div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-[17px] font-bold text-[#423b65]">Fornecedores cadastrados</h2><p className="mt-1 text-[11px] text-[#aaa5b6]">{suppliers.length} de {allCount} registro(s)</p></div><label className="relative block sm:w-[220px]"><Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar fornecedor" className={`${inputClass} pl-9`} /></label></div>{loading ? <EmptyState text="Carregando fornecedores…" /> : suppliers.length ? <div className="divide-y divide-[#f0edf4]">{suppliers.map((supplier) => <div key={supplier.id} className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-full bg-[#f0edff] px-2 py-0.5 text-[10px] font-bold text-[#6d5df5]">#{supplier.internal_code}</span><p className="truncate text-[13px] font-semibold text-[#514a6e]">{supplier.trade_name || supplier.name}</p></div><p className="mt-1 text-[11px] leading-5 text-[#918ba2]">{supplier.document_number || "Documento pendente"}{supplier.seller_name ? ` · ${supplier.seller_name}` : ""}{supplier.categories?.length ? ` · ${supplier.categories.join(", ")}` : ""}</p></div>{canManage && <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => onEdit(supplier)} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label={`Editar ${supplier.name}`}><Pencil size={14} /></button><button type="button" onClick={() => onRemove(supplier)} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#fff1ee] hover:text-[#c16b58]" aria-label={`Remover ${supplier.name}`}><Trash2 size={14} /></button></div>}</div>)}</div> : <EmptyState text="Nenhum fornecedor encontrado." />}</div></div>
  </div>
  <div className="grid gap-5 lg:grid-cols-2"><ContactsEditor contacts={contacts} setContacts={setContacts} disabled={!canManage} /><ItemLinksEditor items={items} itemIds={itemIds} setItemIds={setItemIds} disabled={!canManage} /></div></div>;
}

function ContactsEditor({ contacts, setContacts, disabled }: { contacts: SupplierContact[]; setContacts: (value: SupplierContact[]) => void; disabled: boolean }) {
  const addContact = () => setContacts([...contacts, { name: "", position: "", phone: "", email: "", is_primary: contacts.length === 0 }]);
  return <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[17px] font-bold text-[#423b65]">Contatos e vendedor(a)</h2><p className="mt-1 text-[11px] text-[#aaa5b6]">Adicione vários contatos antes de salvar o fornecedor.</p></div><button type="button" onClick={addContact} disabled={disabled} className="flex items-center gap-1 rounded-lg bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] disabled:opacity-50"><Plus size={13} /> Adicionar</button></div>{contacts.length ? <div className="space-y-3">{contacts.map((contact, index) => <div key={contact.id ?? index} className="rounded-[13px] border border-[#eeeaf1] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Contato {index + 1}</span><button type="button" onClick={() => setContacts(contacts.filter((_, contactIndex) => contactIndex !== index))} disabled={disabled} className="text-[11px] text-[#b36b76]">Remover</button></div><div className="grid gap-2 sm:grid-cols-2"><input value={contact.name} onChange={(event) => setContacts(contacts.map((item, contactIndex) => contactIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Nome" className={inputClass} disabled={disabled} /><input value={contact.position} onChange={(event) => setContacts(contacts.map((item, contactIndex) => contactIndex === index ? { ...item, position: event.target.value } : item))} placeholder="Cargo" className={inputClass} disabled={disabled} /><input value={contact.phone} onChange={(event) => setContacts(contacts.map((item, contactIndex) => contactIndex === index ? { ...item, phone: event.target.value } : item))} placeholder="Telefone / WhatsApp" className={inputClass} disabled={disabled} /><input value={contact.email} onChange={(event) => setContacts(contacts.map((item, contactIndex) => contactIndex === index ? { ...item, email: event.target.value } : item))} type="email" placeholder="E-mail" className={inputClass} disabled={disabled} /></div></div>)}</div> : <EmptyState text="Nenhum contato adicionado." />}</div>;
}

function ItemLinksEditor({ items, itemIds, setItemIds, disabled }: { items: Item[]; itemIds: string[]; setItemIds: (value: string[]) => void; disabled: boolean }) {
  return <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]"><div className="mb-4"><h2 className="font-display text-[17px] font-bold text-[#423b65]">Itens fornecidos</h2><p className="mt-1 text-[11px] text-[#aaa5b6]">Relacione o fornecedor aos itens já cadastrados no sistema.</p></div>{items.length ? <div className="grid max-h-[260px] gap-2 overflow-y-auto sm:grid-cols-2">{items.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-[11px] bg-[#fbfafc] px-3 py-2 text-[12px] text-[#625b77]"><input type="checkbox" checked={itemIds.includes(item.id)} onChange={(event) => setItemIds(event.target.checked ? [...itemIds, item.id] : itemIds.filter((id) => id !== item.id))} disabled={disabled} className="h-4 w-4 accent-[#6d5df5]" />{item.name}</label>)}</div> : <EmptyState text="Cadastre itens antes de relacioná-los ao fornecedor." />}</div>;
}

function SubmitButton({ busy, disabled, editing }: { busy: boolean; disabled: boolean; editing: boolean }) {
  return <button type="submit" disabled={busy || disabled} className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d5df5] text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6] disabled:text-[#aaa4c2]">{editing ? <Save size={15} /> : <Plus size={15} />}{busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}</button>;
}

function PermissionHint({ allowed, text }: { allowed: boolean; text: string }) {
  if (allowed) return null;
  return <p className="rounded-[11px] bg-[#fff9e9] px-3 py-2 text-[10px] leading-4 text-[#957327]">{text}</p>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-8 text-center text-[12px] leading-5 text-[#aaa5b6]">{text}</div>;
}

function CadastroRow({ type, record, canEdit, onEdit, onRemove }: { type: CadastroTab; record: Item | Supplier | Employee; canEdit: boolean; onEdit: () => void; onRemove: () => void }) {
  const employee = type === "employees" ? record as Employee : null;
  return <div className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-[13px] font-semibold text-[#514a6e]">{record.name}</p>{employee && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${employee.active ? "bg-[#e4f7ef] text-[#318464]" : "bg-[#f1eef5] text-[#9b95a7]"}`}>{employee.active ? "Ativo" : "Inativo"}</span>}</div>{employee ? <p className="mt-1 text-[11px] leading-5 text-[#918ba2]">{employee.position}{employee.email ? ` · ${employee.email}` : ""}{employee.phone ? ` · ${employee.phone}` : ""}</p> : <p className="mt-1 text-[10px] text-[#b4aebe]">Registro operacional</p>}</div>{canEdit && <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={onEdit} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label={`Editar ${record.name}`}><Pencil size={14} /></button><button type="button" onClick={onRemove} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#fff1ee] hover:text-[#c16b58]" aria-label={`Remover ${record.name}`}><Trash2 size={14} /></button></div>}</div>;
}

export default CadastroPanel;
