import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Save, Search, ShieldCheck, Trash2, Truck, UsersRound, X, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type CadastroTab = "items" | "suppliers" | "employees";
type Item = { id: string; name: string; created_at: string };
type Supplier = { id: string; name: string; created_at: string };
type Employee = { id: string; name: string; position: string; email: string | null; phone: string | null; active: boolean; created_at: string };
type Editing = { type: CadastroTab; id: string } | null;

const tabs: { key: CadastroTab; label: string; icon: typeof Utensils }[] = [
  { key: "items", label: "Itens", icon: Utensils },
  { key: "suppliers", label: "Fornecedores", icon: Truck },
  { key: "employees", label: "Funcionários", icon: UsersRound },
];

const inputClass = "h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[12px] text-[#625b77] outline-none transition placeholder:text-[#b0abba] focus:border-[#bdb5f7] focus:bg-white";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Não foi possível concluir o cadastro.";
}

export function CadastroPanel() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [activeTab, setActiveTab] = useState<CadastroTab>("items");
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [itemName, setItemName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [employeeForm, setEmployeeForm] = useState({ name: "", position: "", email: "", phone: "", active: true });
  const [editing, setEditing] = useState<Editing>(null);
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
      supabase.from("suppliers").select("id,name,created_at").order("name"),
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

  const resetForms = () => {
    setItemName("");
    setSupplierName("");
    setEmployeeForm({ name: "", position: "", email: "", phone: "", active: true });
    setEditing(null);
  };

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      resetForms();
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
      const result = editing?.type === "items"
        ? await supabase.from("items").update({ name }).eq("id", editing.id)
        : await supabase.from("items").insert({ name });
      if (result.error) throw result.error;
    });
  };

  const submitSupplier = async (event: FormEvent) => {
    event.preventDefault();
    const name = supplierName.trim();
    if (!canManageSuppliers || !name || !session?.user.id) return;
    await run(async () => {
      const result = editing?.type === "suppliers"
        ? await supabase.from("suppliers").update({ name }).eq("id", editing.id)
        : await supabase.from("suppliers").insert({ name, created_by: session.user.id });
      if (result.error) throw result.error;
    });
  };

  const submitEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || !session?.user.id || !employeeForm.name.trim() || !employeeForm.position.trim()) return;
    const payload = {
      name: employeeForm.name.trim(),
      position: employeeForm.position.trim(),
      email: employeeForm.email.trim() || null,
      phone: employeeForm.phone.trim() || null,
      active: employeeForm.active,
    };
    await run(async () => {
      const result = editing?.type === "employees"
        ? await supabase.from("employees").update(payload).eq("id", editing.id)
        : await supabase.from("employees").insert({ ...payload, created_by: session.user.id });
      if (result.error) throw result.error;
    });
  };

  const startEditing = (type: CadastroTab, record: Item | Supplier | Employee) => {
    setEditing({ type, id: record.id });
    if (type === "items") setItemName((record as Item).name);
    if (type === "suppliers") setSupplierName((record as Supplier).name);
    if (type === "employees") {
      const employee = record as Employee;
      setEmployeeForm({ name: employee.name, position: employee.position, email: employee.email ?? "", phone: employee.phone ?? "", active: employee.active });
    }
  };

  const remove = async (type: CadastroTab, id: string, label: string) => {
    if (!window.confirm(`Remover ${label}?`)) return;
    await run(async () => {
      const table = type === "items" ? "items" : type === "suppliers" ? "suppliers" : "employees";
      const result = await supabase.from(table).delete().eq("id", id);
      if (result.error) throw result.error;
    });
  };

  const activeRecords = activeTab === "items" ? items : activeTab === "suppliers" ? suppliers : employees;
  const filteredRecords = activeRecords.filter((record) => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return true;
    if (activeTab === "employees") {
      const employee = record as Employee;
      return [employee.name, employee.position, employee.email, employee.phone].some((value) => value?.toLocaleLowerCase().includes(term));
    }
    return record.name.toLocaleLowerCase().includes(term);
  });
  const activeTabInfo = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · BASE OPERACIONAL</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Cadastros</h1>
          <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#8d879d]">Alimente a operação com os registros que sustentam compras, estoque e a rotina da equipe.</p>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#e9e5f0] bg-white px-4 py-3 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
          <ShieldCheck size={15} className={canManage ? "text-[#42a77f]" : "text-[#f0a05a]"} />
          {rolesLoading ? "Verificando permissões…" : canManage ? "Gerência habilitada" : "Acesso de gestão pendente"}
        </div>
      </div>

      <div className="mb-6 grid gap-2 rounded-[18px] border border-[#ebe7f0] bg-white p-2 shadow-[0_7px_20px_rgba(77,64,120,0.04)] sm:grid-cols-3">
        {tabs.map(({ key, label, icon: Icon }) => {
          const count = key === "items" ? items.length : key === "suppliers" ? suppliers.length : employees.filter((employee) => employee.active).length;
          return (
            <button key={key} onClick={() => { setActiveTab(key); setSearch(""); resetForms(); }} className={`flex items-center justify-between rounded-[13px] px-4 py-3 text-left transition ${activeTab === key ? "bg-[#6d5df5] text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)]" : "text-[#817a95] hover:bg-[#f5f3ff] hover:text-[#6d5df5]"}`}>
              <span className="flex items-center gap-2 text-[11px] font-semibold"><Icon size={15} />{label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === key ? "bg-white/20 text-white" : "bg-[#f4f2fb] text-[#918ba2]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] leading-5 text-[#b85f4a]">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
        <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">{editing ? "Editar registro" : "Novo registro"}</p>
              <h2 className="mt-1 font-display text-[17px] font-bold text-[#423b65]">{editing ? `Editar ${activeTabInfo.label.toLocaleLowerCase()}` : `Cadastrar ${activeTabInfo.label.toLocaleLowerCase()}`}</h2>
            </div>
            {editing && <button type="button" onClick={resetForms} className="rounded-lg p-1.5 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label="Cancelar edição"><X size={16} /></button>}
          </div>

          {activeTab === "items" && <form onSubmit={submitItem} className="mt-5 space-y-3"><input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Nome do item" className={inputClass} /><SubmitButton busy={busy} disabled={!canManage} editing={Boolean(editing)} /><PermissionHint allowed={canManage} text="Somente a Gerência pode criar, editar ou remover itens." /></form>}
          {activeTab === "suppliers" && <form onSubmit={submitSupplier} className="mt-5 space-y-3"><input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Nome do fornecedor" className={inputClass} /><SubmitButton busy={busy} disabled={!canManageSuppliers} editing={Boolean(editing)} /><PermissionHint allowed={canManageSuppliers} text="Gerência ou Compras podem gerenciar fornecedores." /></form>}
          {activeTab === "employees" && <form onSubmit={submitEmployee} className="mt-5 space-y-3"><input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} placeholder="Nome completo" className={inputClass} /><input value={employeeForm.position} onChange={(event) => setEmployeeForm({ ...employeeForm, position: event.target.value })} placeholder="Cargo / função" className={inputClass} /><input value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} type="email" placeholder="E-mail (opcional)" className={inputClass} /><input value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} placeholder="Telefone (opcional)" className={inputClass} /><label className="flex items-center gap-2 px-1 text-[12px] text-[#625b77]"><input type="checkbox" checked={employeeForm.active} onChange={(event) => setEmployeeForm({ ...employeeForm, active: event.target.checked })} className="h-4 w-4 accent-[#6d5df5]" /> Funcionário ativo</label><SubmitButton busy={busy} disabled={!canManage} editing={Boolean(editing)} /><PermissionHint allowed={canManage} text="Somente a Gerência pode gerenciar funcionários." /></form>}
        </div>

        <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-[17px] font-bold text-[#423b65]">{activeTabInfo.label} cadastrados</h2><p className="mt-1 text-[11px] text-[#aaa5b6]">{filteredRecords.length} de {activeRecords.length} registro(s)</p></div><label className="relative block sm:w-[220px]"><Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar" className={`${inputClass} pl-9`} /></label></div>
          {loading ? <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-8 text-center text-[12px] text-[#aaa5b6]">Carregando cadastros…</div> : filteredRecords.length ? <div className="divide-y divide-[#f0edf4]">{filteredRecords.map((record) => <CadastroRow key={record.id} type={activeTab} record={record} canEdit={activeTab === "suppliers" ? canManageSuppliers : canManage} onEdit={() => startEditing(activeTab, record)} onRemove={() => remove(activeTab, record.id, record.name)} />)}</div> : <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-8 text-center text-[12px] leading-5 text-[#aaa5b6]">Nenhum registro encontrado. Comece pelo formulário ao lado.</div>}
        </div>
      </div>
    </section>
  );
}

function SubmitButton({ busy, disabled, editing }: { busy: boolean; disabled: boolean; editing: boolean }) {
  return <button type="submit" disabled={busy || disabled} className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d5df5] text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6] disabled:text-[#aaa4c2]">{editing ? <Save size={15} /> : <Plus size={15} />}{busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}</button>;
}

function PermissionHint({ allowed, text }: { allowed: boolean; text: string }) {
  if (allowed) return null;
  return <p className="rounded-[11px] bg-[#fff9e9] px-3 py-2 text-[10px] leading-4 text-[#957327]">{text}</p>;
}

function CadastroRow({ type, record, canEdit, onEdit, onRemove }: { type: CadastroTab; record: Item | Supplier | Employee; canEdit: boolean; onEdit: () => void; onRemove: () => void }) {
  const employee = type === "employees" ? record as Employee : null;
  return <div className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-[13px] font-semibold text-[#514a6e]">{record.name}</p>{employee && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${employee.active ? "bg-[#e4f7ef] text-[#318464]" : "bg-[#f1eef5] text-[#9b95a7]"}`}>{employee.active ? "Ativo" : "Inativo"}</span>}</div>{employee ? <p className="mt-1 text-[11px] leading-5 text-[#918ba2]">{employee.position}{employee.email ? ` · ${employee.email}` : ""}{employee.phone ? ` · ${employee.phone}` : ""}</p> : <p className="mt-1 text-[10px] text-[#b4aebe]">Registro operacional</p>}</div>{canEdit && <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={onEdit} className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label={`Editar ${record.name}`}><Pencil size={14} /></button><button type="button" onClick={onRemove} className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#fff1ee] hover:text-[#c16b58]" aria-label={`Remover ${record.name}`}><Trash2 size={14} /></button></div>}</div>;
}

export default CadastroPanel;
