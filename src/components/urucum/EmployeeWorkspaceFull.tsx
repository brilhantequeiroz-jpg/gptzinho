import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUrucumRoles } from "@/hooks/useUrucumRoles";

type Employee = {
  id: string;
  internal_code: number;
  name: string;
  social_name: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  nationality: string | null;
  marital_status: string | null;
  email: string | null;
  personal_email: string | null;
  phone: string | null;
  whatsapp: string | null;
  photo_url: string | null;
  postal_code: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relationship: string | null;
  position: string;
  department: string | null;
  hired_at: string | null;
  employment_type: string | null;
  status: string;
  manager_name: string | null;
  unit: string | null;
  work_days: string[];
  shift_start: string | null;
  shift_end: string | null;
  competencies: string[];
  certifications: string[];
  training_notes: string | null;
  has_system_access: boolean;
  system_role: string | null;
  notes: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  pix_key: string | null;
  salary: number | null;
  payment_type: string | null;
  benefits: string[];
  transport_voucher: number | null;
  meal_voucher: number | null;
  active: boolean;
};

type EmployeeForm = {
  name: string;
  socialName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  email: string;
  personalEmail: string;
  phone: string;
  whatsapp: string;
  photoUrl: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  position: string;
  department: string;
  hiredAt: string;
  employmentType: string;
  status: string;
  managerName: string;
  unit: string;
  workDays: string;
  shiftStart: string;
  shiftEnd: string;
  competencies: string;
  certifications: string;
  trainingNotes: string;
  hasSystemAccess: boolean;
  systemRole: string;
  notes: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  pixKey: string;
  salary: string;
  paymentType: string;
  benefits: string;
  transportVoucher: string;
  mealVoucher: string;
};

const emptyForm: EmployeeForm = {
  name: "", socialName: "", cpf: "", rg: "", birthDate: "", nationality: "", maritalStatus: "",
  email: "", personalEmail: "", phone: "", whatsapp: "", photoUrl: "",
  postalCode: "", address: "", addressNumber: "", addressComplement: "", neighborhood: "", city: "", state: "",
  emergencyName: "", emergencyPhone: "", emergencyRelationship: "",
  position: "", department: "", hiredAt: "", employmentType: "", status: "ativo",
  managerName: "", unit: "", workDays: "", shiftStart: "", shiftEnd: "",
  competencies: "", certifications: "", trainingNotes: "",
  hasSystemAccess: false, systemRole: "", notes: "",
  bankName: "", bankBranch: "", bankAccount: "", pixKey: "",
  salary: "", paymentType: "", benefits: "", transportVoucher: "", mealVoucher: "",
};

const inputClass = "h-10 w-full rounded-[11px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[11px] text-[#625b77] outline-none transition placeholder:text-[#b0abba] focus:border-[#bdb5f7] focus:bg-white";
const areaClass = "w-full resize-none rounded-[11px] border border-[#e5e1ee] bg-[#fbfafc] px-3 py-2.5 text-[11px] text-[#625b77] outline-none transition placeholder:text-[#b0abba] focus:border-[#bdb5f7] focus:bg-white";

function listFromText(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function textFromList(value: string[] | null | undefined) {
  return (value ?? []).join(", ");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Não foi possível concluir o cadastro.";
}

function employeeToForm(employee: Employee): EmployeeForm {
  return {
    name: employee.name,
    socialName: employee.social_name ?? "",
    cpf: employee.cpf ?? "",
    rg: employee.rg ?? "",
    birthDate: employee.birth_date ?? "",
    nationality: employee.nationality ?? "",
    maritalStatus: employee.marital_status ?? "",
    email: employee.email ?? "",
    personalEmail: employee.personal_email ?? "",
    phone: employee.phone ?? "",
    whatsapp: employee.whatsapp ?? "",
    photoUrl: employee.photo_url ?? "",
    postalCode: employee.postal_code ?? "",
    address: employee.address ?? "",
    addressNumber: employee.address_number ?? "",
    addressComplement: employee.address_complement ?? "",
    neighborhood: employee.neighborhood ?? "",
    city: employee.city ?? "",
    state: employee.state ?? "",
    emergencyName: employee.emergency_name ?? "",
    emergencyPhone: employee.emergency_phone ?? "",
    emergencyRelationship: employee.emergency_relationship ?? "",
    position: employee.position,
    department: employee.department ?? "",
    hiredAt: employee.hired_at ?? "",
    employmentType: employee.employment_type ?? "",
    status: employee.status || "ativo",
    managerName: employee.manager_name ?? "",
    unit: employee.unit ?? "",
    workDays: textFromList(employee.work_days),
    shiftStart: employee.shift_start?.slice(0, 5) ?? "",
    shiftEnd: employee.shift_end?.slice(0, 5) ?? "",
    competencies: textFromList(employee.competencies),
    certifications: textFromList(employee.certifications),
    trainingNotes: employee.training_notes ?? "",
    hasSystemAccess: employee.has_system_access,
    systemRole: employee.system_role ?? "",
    notes: employee.notes ?? "",
    bankName: employee.bank_name ?? "",
    bankBranch: employee.bank_branch ?? "",
    bankAccount: employee.bank_account ?? "",
    pixKey: employee.pix_key ?? "",
    salary: employee.salary?.toString() ?? "",
    paymentType: employee.payment_type ?? "",
    benefits: textFromList(employee.benefits),
    transportVoucher: employee.transport_voucher?.toString() ?? "",
    mealVoucher: employee.meal_voucher?.toString() ?? "",
  };
}

export function EmployeeWorkspaceFull() {
  const { session } = useAuth();
  const { hasRole, loading: rolesLoading } = useUrucumRoles();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canManage = hasRole("gerencia");

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const result = await supabase
      .from("employees")
      .select("id,internal_code,name,social_name,cpf,rg,birth_date,nationality,marital_status,email,personal_email,phone,whatsapp,photo_url,postal_code,address,address_number,address_complement,neighborhood,city,state,emergency_name,emergency_phone,emergency_relationship,position,department,hired_at,employment_type,status,manager_name,unit,work_days,shift_start,shift_end,competencies,certifications,training_notes,has_system_access,system_role,notes,bank_name,bank_branch,bank_account,pix_key,salary,payment_type,benefits,transport_voucher,meal_voucher,active")
      .order("name");
    if (result.error) setError(result.error.message);
    setEmployees(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const update = (field: keyof EmployeeForm, value: string | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || !session?.user.id || !form.name.trim() || !form.position.trim()) return;
    setBusy(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      social_name: form.socialName.trim() || null,
      cpf: form.cpf.trim() || null,
      rg: form.rg.trim() || null,
      birth_date: form.birthDate || null,
      nationality: form.nationality.trim() || null,
      marital_status: form.maritalStatus.trim() || null,
      email: form.email.trim() || null,
      personal_email: form.personalEmail.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      photo_url: form.photoUrl.trim() || null,
      postal_code: form.postalCode.trim() || null,
      address: form.address.trim() || null,
      address_number: form.addressNumber.trim() || null,
      address_complement: form.addressComplement.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      emergency_name: form.emergencyName.trim() || null,
      emergency_phone: form.emergencyPhone.trim() || null,
      emergency_relationship: form.emergencyRelationship.trim() || null,
      position: form.position.trim(),
      department: form.department.trim() || null,
      hired_at: form.hiredAt || null,
      employment_type: form.employmentType.trim() || null,
      status: form.status,
      active: form.status === "ativo",
      manager_name: form.managerName.trim() || null,
      unit: form.unit.trim() || null,
      work_days: listFromText(form.workDays),
      shift_start: form.shiftStart || null,
      shift_end: form.shiftEnd || null,
      competencies: listFromText(form.competencies),
      certifications: listFromText(form.certifications),
      training_notes: form.trainingNotes.trim() || null,
      has_system_access: form.hasSystemAccess,
      system_role: form.systemRole.trim() || null,
      notes: form.notes.trim() || null,
      bank_name: form.bankName.trim() || null,
      bank_branch: form.bankBranch.trim() || null,
      bank_account: form.bankAccount.trim() || null,
      pix_key: form.pixKey.trim() || null,
      salary: form.salary ? Number(form.salary) : null,
      payment_type: form.paymentType.trim() || null,
      benefits: listFromText(form.benefits),
      transport_voucher: form.transportVoucher ? Number(form.transportVoucher) : null,
      meal_voucher: form.mealVoucher ? Number(form.mealVoucher) : null,
    };
    const result = editingId
      ? await supabase.from("employees").update(payload).eq("id", editingId)
      : await supabase.from("employees").insert({ ...payload, created_by: session.user.id });
    if (result.error) setError(errorMessage(result.error));
    else {
      reset();
      await refresh();
    }
    setBusy(false);
  };

  const edit = (employee: Employee) => {
    setEditingId(employee.id);
    setForm(employeeToForm(employee));
    setError("");
  };

  const remove = async (employee: Employee) => {
    if (!window.confirm(`Remover ${employee.name}?`)) return;
    setBusy(true);
    const result = await supabase.from("employees").delete().eq("id", employee.id);
    if (result.error) setError(errorMessage(result.error));
    else await refresh();
    setBusy(false);
  };

  const filtered = employees.filter((employee) =>
    [employee.name, employee.social_name, employee.cpf, employee.position, employee.department, employee.internal_code.toString()].some(
      (value) => value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )
  );

  return (
    <section className="mx-auto w-full max-w-[1120px] py-7">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · PESSOAS</p>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Funcionários</h1>
          <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-[#8d879d]">
            Identifique a equipe, organize a operação e mantenha treinamentos e acessos sob controle.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#e9e5f0] bg-white px-4 py-3 text-[11px] font-semibold text-[#918ba2] shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
          <ShieldCheck size={15} className={canManage ? "text-[#42a77f]" : "text-[#f0a05a]"} />
          {rolesLoading ? "Verificando permissões…" : canManage ? "Gerência habilitada" : "Acesso de gestão pendente"}
        </div>
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] leading-5 text-[#b85f4a]">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[470px_1fr]">
        <form onSubmit={submit} className="max-h-[calc(100vh-175px)] overflow-y-auto rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">{editingId ? "Editar registro" : "Novo registro"}</p>
              <h2 className="mt-1 font-display text-[17px] font-bold text-[#423b65]">Identificação do funcionário</h2>
            </div>
            {editingId && (
              <button type="button" onClick={reset} className="rounded-lg p-1.5 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label="Cancelar edição">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-5 space-y-5">
            <FormSection title="Identificação">
              <div className="grid gap-2 sm:grid-cols-2">
                <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome completo *" className={inputClass} />
                <input value={form.socialName} onChange={(e) => update("socialName", e.target.value)} placeholder="Nome social" className={inputClass} />
                <input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="CPF" className={inputClass} />
                <input value={form.rg} onChange={(e) => update("rg", e.target.value)} placeholder="RG" className={inputClass} />
                <input value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} type="date" className={inputClass} />
                <input value={form.nationality} onChange={(e) => update("nationality", e.target.value)} placeholder="Nacionalidade" className={inputClass} />
                <input value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} placeholder="Estado civil" className={inputClass} />
                <input value={form.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="URL da foto" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Contatos">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="E-mail corporativo" className={inputClass} />
                <input value={form.personalEmail} onChange={(e) => update("personalEmail", e.target.value)} type="email" placeholder="E-mail pessoal" className={inputClass} />
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Telefone" className={inputClass} />
                <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="WhatsApp" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Endereço">
              <div className="grid gap-2 sm:grid-cols-3">
                <input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="CEP" className={inputClass} />
                <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua / avenida" className={`${inputClass} sm:col-span-2`} />
                <input value={form.addressNumber} onChange={(e) => update("addressNumber", e.target.value)} placeholder="Número" className={inputClass} />
                <input value={form.addressComplement} onChange={(e) => update("addressComplement", e.target.value)} placeholder="Complemento" className={inputClass} />
                <input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} placeholder="Bairro" className={inputClass} />
                <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Cidade" className={inputClass} />
                <input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="UF" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Vínculo profissional">
              <div className="grid gap-2 sm:grid-cols-2">
                <input required value={form.position} onChange={(e) => update("position", e.target.value)} placeholder="Cargo / função *" className={inputClass} />
                <input value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Setor" className={inputClass} />
                <input value={form.hiredAt} onChange={(e) => update("hiredAt", e.target.value)} type="date" className={inputClass} />
                <input value={form.employmentType} onChange={(e) => update("employmentType", e.target.value)} placeholder="Tipo de vínculo" className={inputClass} />
                <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
                  <option value="ativo">Ativo</option>
                  <option value="ferias">Férias</option>
                  <option value="afastado">Afastado</option>
                  <option value="desligado">Desligado</option>
                </select>
                <input value={form.managerName} onChange={(e) => update("managerName", e.target.value)} placeholder="Gestor responsável" className={inputClass} />
                <input value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="Unidade / restaurante" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Escala e competências">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={form.workDays} onChange={(e) => update("workDays", e.target.value)} placeholder="Dias de trabalho (vírgula)" className={inputClass} />
                <input value={form.competencies} onChange={(e) => update("competencies", e.target.value)} placeholder="Competências (vírgula)" className={inputClass} />
                <input value={form.shiftStart} onChange={(e) => update("shiftStart", e.target.value)} type="time" className={inputClass} />
                <input value={form.shiftEnd} onChange={(e) => update("shiftEnd", e.target.value)} type="time" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Contato de emergência">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} placeholder="Nome" className={inputClass} />
                <input value={form.emergencyRelationship} onChange={(e) => update("emergencyRelationship", e.target.value)} placeholder="Grau de parentesco" className={inputClass} />
                <input value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} placeholder="Telefone" className={inputClass} />
              </div>
            </FormSection>

            <FormSection title="Treinamentos e acesso">
              <input value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="Certificações (vírgula)" className={inputClass} />
              <textarea value={form.trainingNotes} onChange={(e) => update("trainingNotes", e.target.value)} placeholder="Treinamentos realizados e validade" rows={2} className={areaClass} />
              <label className="flex items-center gap-2 text-[11px] text-[#625b77]">
                <input type="checkbox" checked={form.hasSystemAccess} onChange={(e) => update("hasSystemAccess", e.target.checked)} className="h-4 w-4 accent-[#6d5df5]" />
                Possui acesso ao sistema
              </label>
              <input value={form.systemRole} onChange={(e) => update("systemRole", e.target.value)} placeholder="Perfil de acesso previsto" className={inputClass} />
            </FormSection>

            <FormSection title="Dados financeiros restritos">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="Banco" className={inputClass} />
                <input value={form.bankBranch} onChange={(e) => update("bankBranch", e.target.value)} placeholder="Agência" className={inputClass} />
                <input value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} placeholder="Conta" className={inputClass} />
                <input value={form.pixKey} onChange={(e) => update("pixKey", e.target.value)} placeholder="Chave PIX" className={inputClass} />
                <input value={form.salary} onChange={(e) => update("salary", e.target.value)} type="number" min="0" step="0.01" placeholder="Salário" className={inputClass} />
                <input value={form.paymentType} onChange={(e) => update("paymentType", e.target.value)} placeholder="Tipo de pagamento" className={inputClass} />
                <input value={form.benefits} onChange={(e) => update("benefits", e.target.value)} placeholder="Benefícios (vírgula)" className={inputClass} />
                <input value={form.transportVoucher} onChange={(e) => update("transportVoucher", e.target.value)} type="number" min="0" step="0.01" placeholder="Vale-transporte" className={inputClass} />
                <input value={form.mealVoucher} onChange={(e) => update("mealVoucher", e.target.value)} type="number" min="0" step="0.01" placeholder="Vale-alimentação" className={inputClass} />
              </div>
            </FormSection>

            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Observações gerais" rows={2} className={areaClass} />

            <button type="submit" disabled={busy || !canManage} className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#6d5df5] text-[12px] font-semibold text-white transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6]">
              {busy ? "Salvando…" : editingId ? "Salvar alterações" : "Cadastrar funcionário"}
            </button>
            {!canManage && <p className="rounded-[11px] bg-[#fff9e9] px-3 py-2 text-[10px] leading-4 text-[#957327]">Somente a Gerência pode gerenciar funcionários.</p>}
          </div>
        </form>

        <div className="rounded-[20px] border border-[#ebe7f0] bg-white p-5 shadow-[0_7px_20px_rgba(77,64,120,0.04)]">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-[17px] font-bold text-[#423b65]">Equipe cadastrada</h2>
              <p className="mt-1 text-[11px] text-[#aaa5b6]">{filtered.length} de {employees.length} funcionário(s)</p>
            </div>
            <label className="relative block sm:w-[220px]">
              <Search size={14} className="absolute left-3 top-3 text-[#aaa5b6]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar funcionário" className={`${inputClass} pl-9`} />
            </label>
          </div>

          {loading ? (
            <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-8 text-center text-[12px] text-[#aaa5b6]">Carregando funcionários…</div>
          ) : filtered.length ? (
            <div className="divide-y divide-[#f0edf4]">
              {filtered.map((employee) => (
                <div key={employee.id} className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#f0edff] px-2 py-0.5 text-[10px] font-bold text-[#6d5df5]">#{employee.internal_code}</span>
                      <p className="truncate text-[13px] font-semibold text-[#514a6e]">{employee.social_name || employee.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${employee.status === "ativo" ? "bg-[#e4f7ef] text-[#318464]" : "bg-[#f1eef5] text-[#9b95a7]"}`}>{employee.status}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-[#918ba2]">
                      {employee.position}{employee.department ? ` · ${employee.department}` : ""}{employee.unit ? ` · ${employee.unit}` : ""}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => edit(employee)} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#f5f3ff] hover:text-[#6d5df5]" aria-label={`Editar ${employee.name}`}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => remove(employee)} className="rounded-lg p-2 text-[#aaa5b6] hover:bg-[#fff1ee] hover:text-[#c16b58]" aria-label={`Remover ${employee.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[13px] border border-dashed border-[#ded9eb] px-4 py-8 text-center text-[12px] leading-5 text-[#aaa5b6]">
              Nenhum funcionário encontrado. Comece pelo formulário ao lado.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b82cf]">{title}</p>
      {children}
    </div>
  );
}

export default EmployeeWorkspaceFull;
