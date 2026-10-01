import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Search,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Printer,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type Ficha = {
  id: string;
  product_name: string;
  product_photo_url: string | null;
  status: string;
  cardapio_price: number;
  gross_profit: number;
  mark_up: number;
  portions: number;
  total_cost: number;
  cost_per_portion: number;
  suggested_consumer_price: number;
  preparation_mode: string | null;
  created_at: string;
  updated_at: string;
};

type Ingredient = {
  id: string;
  ficha_tecnica_id: string;
  ingredient_name: string;
  unit: string;
  liquid_quantity: number;
  yield_percentage: number;
  gross_quantity: number;
  unit_value: number;
  total_value: number;
  display_order: number;
};

type Utensil = {
  id: string;
  ficha_tecnica_id: string;
  utensil_name: string;
  quantity: number;
  display_order: number;
};

type PrepStep = {
  id: string;
  ficha_tecnica_id: string;
  step_number: number;
  description: string;
  display_order: number;
};

type FichaDetail = Ficha & {
  ingredients: Ingredient[];
  utensils: Utensil[];
  prep_steps: PrepStep[];
};

type DraftIngredient = {
  ingredient_name: string;
  unit: string;
  liquid_quantity: string;
  yield_percentage: string;
  gross_quantity: string;
  unit_value: string;
  total_value: string;
};

type DraftUtensil = {
  utensil_name: string;
  quantity: string;
};

type DraftPrepStep = {
  description: string;
};

const UNITS = ["Kg", "Unil", "L", "g", "ml", "Un"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function FichasTecnicas() {
  const { session } = useAuth();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "detail" | "edit">("list");
  const [selectedFicha, setSelectedFicha] = useState<FichaDetail | null>(null);
  const [busy, setBusy] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    product_name: "",
    cardapio_price: "",
    portions: "1",
    suggested_consumer_price: "",
  });
  const [draftIngredients, setDraftIngredients] = useState<DraftIngredient[]>([]);
  const [draftUtensils, setDraftUtensils] = useState<DraftUtensil[]>([]);
  const [draftPrepSteps, setDraftPrepSteps] = useState<DraftPrepStep[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const refresh = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    setFichas(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  const filteredFichas = useMemo(() => {
    let result = fichas;
    if (searchTerm) {
      result = result.filter((f) => f.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus) {
      result = result.filter((f) => f.status === filterStatus);
    }
    return result;
  }, [fichas, searchTerm, filterStatus]);

  const loadFichaDetailReturn = async (fichaId: string): Promise<FichaDetail | null> => {
    const [ingredients, utensils, prepSteps] = await Promise.all([
      supabase.from("ficha_tecnica_ingredients").select("*").eq("ficha_tecnica_id", fichaId).order("display_order"),
      supabase.from("ficha_tecnica_utensils").select("*").eq("ficha_tecnica_id", fichaId).order("display_order"),
      supabase.from("ficha_tecnica_preparation_steps").select("*").eq("ficha_tecnica_id", fichaId).order("display_order"),
    ]);
    const ficha = fichas.find((f) => f.id === fichaId);
    if (!ficha) return null;
    const detail: FichaDetail = {
      ...ficha,
      ingredients: ingredients.data ?? [],
      utensils: utensils.data ?? [],
      prep_steps: prepSteps.data ?? [],
    };
    setSelectedFicha(detail);
    return detail;
  };

  const loadFichaDetail = async (fichaId: string) => {
    await loadFichaDetailReturn(fichaId);
  };

  const openDetail = async (ficha: Ficha) => {
    await loadFichaDetail(ficha.id);
    setViewMode("detail");
  };

  const openEdit = async (ficha: Ficha) => {
    const detail = await loadFichaDetailReturn(ficha.id);
    setEditForm({
      product_name: ficha.product_name,
      cardapio_price: ficha.cardapio_price ? String(ficha.cardapio_price) : "",
      portions: String(ficha.portions),
      suggested_consumer_price: ficha.suggested_consumer_price ? String(ficha.suggested_consumer_price) : "",
    });
    setDraftIngredients(
      (detail?.ingredients ?? []).map((ing) => ({
        ingredient_name: ing.ingredient_name,
        unit: ing.unit,
        liquid_quantity: String(ing.liquid_quantity),
        yield_percentage: String(ing.yield_percentage),
        gross_quantity: String(ing.gross_quantity),
        unit_value: String(ing.unit_value),
        total_value: String(ing.total_value),
      }))
    );
    setDraftUtensils(
      (detail?.utensils ?? []).map((u) => ({
        utensil_name: u.utensil_name,
        quantity: String(u.quantity),
      }))
    );
    setDraftPrepSteps(
      (detail?.prep_steps ?? []).map((s) => ({
        description: s.description,
      }))
    );
    setIsEditing(true);
    setViewMode("edit");
  };

  const openNew = () => {
    setEditForm({ product_name: "", cardapio_price: "", portions: "1", suggested_consumer_price: "" });
    setDraftIngredients([{ ingredient_name: "", unit: "Kg", liquid_quantity: "", yield_percentage: "100", gross_quantity: "", unit_value: "", total_value: "" }]);
    setDraftUtensils([{ utensil_name: "", quantity: "1" }]);
    setDraftPrepSteps([{ description: "" }]);
    setIsEditing(false);
    setViewMode("edit");
  };

  const saveFicha = async () => {
    if (!session?.user.id) return;
    if (!editForm.product_name.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const cardapioPrice = Number(editForm.cardapio_price) || 0;
      const portions = Number(editForm.portions) || 1;
      const suggestedPrice = Number(editForm.suggested_consumer_price) || 0;

      // Calculate totals
      const totalCost = draftIngredients.reduce((sum, ing) => sum + (Number(ing.total_value) || 0), 0);
      const costPerPortion = portions > 0 ? totalCost / portions : 0;
      const grossProfit = cardapioPrice - totalCost;
      const markUp = totalCost > 0 ? (cardapioPrice / totalCost - 1) * 100 : 0;

      let fichaId = selectedFicha?.id;

      if (!fichaId) {
        const { data: newFicha, error: insertError } = await supabase
          .from("fichas_tecnicas")
          .insert({
            product_name: editForm.product_name.trim(),
            cardapio_price: cardapioPrice,
            portions,
            suggested_consumer_price: suggestedPrice,
            total_cost: totalCost,
            cost_per_portion: costPerPortion,
            gross_profit: grossProfit,
            mark_up: markUp,
            created_by: session.user.id,
          })
          .select()
          .single();
        if (insertError) throw insertError;
        fichaId = newFicha.id;
      } else {
        const { error: updateError } = await supabase
          .from("fichas_tecnicas")
          .update({
            product_name: editForm.product_name.trim(),
            cardapio_price: cardapioPrice,
            portions,
            suggested_consumer_price: suggestedPrice,
            total_cost: totalCost,
            cost_per_portion: costPerPortion,
            gross_profit: grossProfit,
            mark_up: markUp,
            updated_by: session.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", fichaId);
        if (updateError) throw updateError;

        // Delete old sub-records
        await supabase.from("ficha_tecnica_ingredients").delete().eq("ficha_tecnica_id", fichaId);
        await supabase.from("ficha_tecnica_utensils").delete().eq("ficha_tecnica_id", fichaId);
        await supabase.from("ficha_tecnica_preparation_steps").delete().eq("ficha_tecnica_id", fichaId);
      }

      // Insert ingredients
      const validIngredients = draftIngredients.filter((ing) => ing.ingredient_name.trim());
      if (validIngredients.length > 0) {
        const ingRows = validIngredients.map((ing, idx) => ({
          ficha_tecnica_id: fichaId,
          ingredient_name: ing.ingredient_name.trim(),
          unit: ing.unit,
          liquid_quantity: Number(ing.liquid_quantity) || 0,
          yield_percentage: Number(ing.yield_percentage) || 100,
          gross_quantity: Number(ing.gross_quantity) || 0,
          unit_value: Number(ing.unit_value) || 0,
          total_value: Number(ing.total_value) || 0,
          display_order: idx,
        }));
        const { error: ingError } = await supabase.from("ficha_tecnica_ingredients").insert(ingRows);
        if (ingError) throw ingError;
      }

      // Insert utensils
      const validUtensils = draftUtensils.filter((u) => u.utensil_name.trim());
      if (validUtensils.length > 0) {
        const utRows = validUtensils.map((u, idx) => ({
          ficha_tecnica_id: fichaId,
          utensil_name: u.utensil_name.trim(),
          quantity: Number(u.quantity) || 1,
          display_order: idx,
        }));
        const { error: utError } = await supabase.from("ficha_tecnica_utensils").insert(utRows);
        if (utError) throw utError;
      }

      // Insert prep steps
      const validSteps = draftPrepSteps.filter((s) => s.description.trim());
      if (validSteps.length > 0) {
        const stepRows = validSteps.map((s, idx) => ({
          ficha_tecnica_id: fichaId,
          step_number: idx + 1,
          description: s.description.trim(),
          display_order: idx,
        }));
        const { error: stepError } = await supabase.from("ficha_tecnica_preparation_steps").insert(stepRows);
        if (stepError) throw stepError;
      }

      await refresh();
      setViewMode("list");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar ficha técnica.");
    } finally {
      setBusy(false);
    }
  };

  const deleteFicha = async (fichaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ficha técnica?")) return;
    setBusy(true);
    setError("");
    try {
      const { error: delError } = await supabase.from("fichas_tecnicas").delete().eq("id", fichaId);
      if (delError) throw delError;
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir ficha.");
    } finally {
      setBusy(false);
    }
  };

  const updateIngredient = (index: number, field: keyof DraftIngredient, value: string) => {
    setDraftIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Auto-calculate total_value = liquid_quantity * unit_value
      if (field === "liquid_quantity" || field === "unit_value") {
        const liq = Number(next[index].liquid_quantity) || 0;
        const uv = Number(next[index].unit_value) || 0;
        next[index].total_value = String(liq * uv);
      }
      // Auto-calculate gross_quantity = liquid_quantity / (yield_percentage / 100)
      if (field === "liquid_quantity" || field === "yield_percentage") {
        const liq = Number(next[index].liquid_quantity) || 0;
        const yieldPct = Number(next[index].yield_percentage) || 100;
        next[index].gross_quantity = yieldPct > 0 ? String(liq / (yieldPct / 100)) : "0";
      }
      return next;
    });
  };

  const addIngredient = () => {
    setDraftIngredients((prev) => [...prev, { ingredient_name: "", unit: "Kg", liquid_quantity: "", yield_percentage: "100", gross_quantity: "", unit_value: "", total_value: "" }]);
  };

  const removeIngredient = (index: number) => {
    setDraftIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addUtensil = () => {
    setDraftUtensils((prev) => [...prev, { utensil_name: "", quantity: "1" }]);
  };

  const removeUtensil = (index: number) => {
    setDraftUtensils((prev) => prev.filter((_, i) => i !== index));
  };

  const addPrepStep = () => {
    setDraftPrepSteps((prev) => [...prev, { description: "" }]);
  };

  const removePrepStep = (index: number) => {
    setDraftPrepSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedTotal = draftIngredients.reduce((sum, ing) => sum + (Number(ing.total_value) || 0), 0);
  const calculatedPortions = Number(editForm.portions) || 1;
  const calculatedCostPerPortion = calculatedPortions > 0 ? calculatedTotal / calculatedPortions : 0;
  const calculatedGrossProfit = (Number(editForm.cardapio_price) || 0) - calculatedTotal;
  const calculatedMarkUp = calculatedTotal > 0 ? ((Number(editForm.cardapio_price) || 0) / calculatedTotal - 1) * 100 : 0;

  // ─── LIST VIEW ───
  if (viewMode === "list") {
    return (
      <section className="mx-auto w-full max-w-[1050px] py-7">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">URUCUM · FICHAS TÉCNICAS</p>
            <h1 className="font-display text-[30px] font-bold tracking-[-0.05em] text-[#342d57]">Fichas Técnicas</h1>
            <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#8d879d]">
              Gerencie as fichas técnicas dos produtos do cardápio, com ingredientes, custos, modo de preparo e utensílios.
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-[13px] bg-[#6d5df5] px-4 py-3 text-[12px] font-semibold text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)] transition hover:bg-[#5b4ada]"
          >
            <Plus size={15} /> Nova Ficha Técnica
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-3 text-[#aaa5b6]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto..."
              className="h-10 w-full rounded-[11px] border border-[#e5e1ee] bg-white pl-9 pr-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-[11px] border border-[#e5e1ee] bg-white px-3 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
          >
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="aprovado">Aprovado</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>

        {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">{error}</div>}

        {loading ? (
          <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center text-sm text-[#918ba2]">Carregando fichas…</div>
        ) : filteredFichas.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#ded9eb] p-10 text-center">
            <FileText size={32} className="mx-auto mb-3 text-[#c5c0d4]" />
            <p className="text-[13px] font-semibold text-[#625b77]">Nenhuma ficha técnica encontrada</p>
            <p className="mt-1 text-[11px] text-[#a09aaa]">Crie a primeira ficha técnica clicando em "Nova Ficha Técnica".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFichas.map((ficha) => (
              <div key={ficha.id} className="group rounded-[18px] border border-[#ebe7f0] bg-white p-4 shadow-[0_5px_14px_rgba(77,64,120,0.04)] transition hover:shadow-[0_8px_20px_rgba(77,64,120,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] bg-[#f5f3ff]">
                      {ficha.product_photo_url ? (
                        <img src={ficha.product_photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FileText size={20} className="text-[#8b82cf]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#423b65]">{ficha.product_name}</p>
                      <p className="mt-0.5 text-[11px] text-[#a09aaa]">
                        {ficha.portions} porção(ões) · {formatCurrency(ficha.total_cost)} · {formatCurrency(ficha.cardapio_price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${ficha.status === "aprovado" ? "bg-[#e8f5e9] text-[#2e7d32]" : ficha.status === "arquivado" ? "bg-[#f5f5f5] text-[#918ba2]" : "bg-[#fff3e0] text-[#ef6c00]"}`}>
                      {ficha.status}
                    </span>
                    <button onClick={() => openDetail(ficha)} className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]" title="Ver">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(ficha)} className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#f5f3ff] hover:text-[#6d5df5]" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteFicha(ficha.id)} className="rounded-lg p-2 text-[#aaa5b6] transition hover:bg-[#fff5f2] hover:text-[#b85f4a]" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ─── DETAIL VIEW ───
  if (viewMode === "detail" && selectedFicha) {
    return (
      <section className="mx-auto w-full max-w-[1050px] py-7">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6d5df5] transition hover:text-[#5b4ada]">
            ← Voltar à lista
          </button>
          <div className="flex gap-2">
            <button onClick={() => openEdit(selectedFicha)} className="flex items-center gap-1.5 rounded-[11px] bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] transition hover:bg-[#e6e2ff]">
              <Pencil size={13} /> Editar
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-[11px] bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] transition hover:bg-[#e6e2ff]">
              <Printer size={13} /> Imprimir
            </button>
          </div>
        </div>

        {/* Ficha Card */}
        <div className="overflow-hidden rounded-[20px] border border-[#ebe7f0] bg-white shadow-[0_8px_24px_rgba(77,64,120,0.06)]">
          {/* Header */}
          <div className="border-b border-[#ebe7f0] bg-[#faf9ff] px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b82cf]">FICHA TÉCNICA</p>
                <h2 className="mt-1 font-display text-[24px] font-bold tracking-[-0.04em] text-[#342d57]">{selectedFicha.product_name}</h2>
                <p className="mt-1 text-[11px] text-[#a09aaa]">
                  Criado em {formatDate(selectedFicha.created_at)}
                  {selectedFicha.updated_at !== selectedFicha.created_at && ` · Atualizado em ${formatDate(selectedFicha.updated_at)}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${selectedFicha.status === "aprovado" ? "bg-[#e8f5e9] text-[#2e7d32]" : selectedFicha.status === "arquivado" ? "bg-[#f5f5f5] text-[#918ba2]" : "bg-[#fff3e0] text-[#ef6c00]"}`}>
                  {selectedFicha.status}
                </span>
                {selectedFicha.product_photo_url && (
                  <img src={selectedFicha.product_photo_url} alt="" className="h-20 w-20 rounded-[14px] object-cover shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Cost Summary */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Valor de Cardápio</p>
                <p className="mt-1 font-display text-[18px] font-bold text-[#423b65]">{formatCurrency(selectedFicha.cardapio_price)}</p>
              </div>
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Lucro Bruto</p>
                <p className={`mt-1 font-display text-[18px] font-bold ${selectedFicha.gross_profit >= 0 ? "text-[#2e7d32]" : "text-[#b85f4a]"}`}>{formatCurrency(selectedFicha.gross_profit)}</p>
              </div>
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Mark Up</p>
                <p className="mt-1 font-display text-[18px] font-bold text-[#423b65]">{selectedFicha.mark_up.toFixed(1)}%</p>
              </div>
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">N. Porções</p>
                <p className="mt-1 font-display text-[18px] font-bold text-[#423b65]">{selectedFicha.portions}</p>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="mb-6">
              <h3 className="mb-3 font-display text-[16px] font-bold text-[#423b65]">Ingredientes</h3>
              {selectedFicha.ingredients.length > 0 ? (
                <div className="overflow-x-auto rounded-[14px] border border-[#ebe7f0]">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-[#ebe7f0] bg-[#faf9ff]">
                        <th className="px-3 py-2.5 font-semibold text-[#625b77]">Ingrediente</th>
                        <th className="px-3 py-2.5 font-semibold text-[#625b77]">Unidade</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Quant. Líq.</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Rend.</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Quant. Bruta</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Vlr. Unit.</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-[#625b77]">Vlr. Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFicha.ingredients.map((ing) => (
                        <tr key={ing.id} className="border-b border-[#f0edf4] last:border-0">
                          <td className="px-3 py-2.5 font-medium text-[#514a6e]">{ing.ingredient_name}</td>
                          <td className="px-3 py-2.5 text-[#625b77]">{ing.unit}</td>
                          <td className="px-3 py-2.5 text-right text-[#625b77]">{ing.liquid_quantity}</td>
                          <td className="px-3 py-2.5 text-right text-[#625b77]">{ing.yield_percentage}%</td>
                          <td className="px-3 py-2.5 text-right text-[#625b77]">{ing.gross_quantity}</td>
                          <td className="px-3 py-2.5 text-right text-[#625b77]">{formatCurrency(ing.unit_value)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-[#423b65]">{formatCurrency(ing.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#faf9ff]">
                        <td colSpan={6} className="px-3 py-2.5 text-right font-bold text-[#423b65]">TOTAL</td>
                        <td className="px-3 py-2.5 text-right font-bold text-[#423b65]">{formatCurrency(selectedFicha.total_cost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="rounded-[12px] border border-dashed border-[#ded9eb] px-4 py-5 text-center text-[12px] text-[#a09aaa]">Nenhum ingrediente cadastrado.</p>
              )}
            </div>

            {/* Cost per portion */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Vlr. Por Porção</p>
                <p className="mt-1 font-display text-[16px] font-bold text-[#423b65]">{formatCurrency(selectedFicha.cost_per_portion)}</p>
              </div>
              <div className="rounded-[14px] bg-[#f8f7fc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa5b6]">Vlr. Sugerido Consumidor</p>
                <p className="mt-1 font-display text-[16px] font-bold text-[#423b65]">{formatCurrency(selectedFicha.suggested_consumer_price)}</p>
              </div>
            </div>

            {/* Preparation Mode */}
            <div className="mb-6">
              <h3 className="mb-3 font-display text-[16px] font-bold text-[#423b65]">Modo de Preparo</h3>
              {selectedFicha.prep_steps.length > 0 ? (
                <ol className="space-y-2">
                  {selectedFicha.prep_steps.map((step) => (
                    <li key={step.id} className="flex gap-3 rounded-[12px] bg-[#f8f7fc] px-4 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6d5df5] text-[10px] font-bold text-white">{step.step_number}</span>
                      <p className="text-[12px] leading-5 text-[#514a6e]">{step.description}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-[12px] border border-dashed border-[#ded9eb] px-4 py-5 text-center text-[12px] text-[#a09aaa]">Nenhum passo de preparo cadastrado.</p>
              )}
            </div>

            {/* Utensils */}
            <div>
              <h3 className="mb-3 font-display text-[16px] font-bold text-[#423b65]">Utensílios Necessários</h3>
              {selectedFicha.utensils.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {selectedFicha.utensils.map((ut) => (
                    <div key={ut.id} className="flex items-center justify-between rounded-[12px] bg-[#f8f7fc] px-3 py-2.5">
                      <span className="text-[12px] font-medium text-[#514a6e]">{ut.utensil_name}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6d5df5] text-[10px] font-bold text-white">{ut.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[12px] border border-dashed border-[#ded9eb] px-4 py-5 text-center text-[12px] text-[#a09aaa]">Nenhum utensílio cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── EDIT / NEW VIEW ───
  return (
    <section className="mx-auto w-full max-w-[1050px] py-7">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6d5df5] transition hover:text-[#5b4ada]">
          ← Voltar à lista
        </button>
        <button
          onClick={saveFicha}
          disabled={busy}
          className="flex items-center gap-2 rounded-[13px] bg-[#6d5df5] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_7px_15px_rgba(109,93,245,0.2)] transition hover:bg-[#5b4ada] disabled:cursor-not-allowed disabled:bg-[#e7e3f6]"
        >
          <Save size={14} /> {isEditing ? "Salvar Alterações" : "Criar Ficha"}
        </button>
      </div>

      {error && <div className="mb-5 rounded-[14px] border border-[#f3c9be] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#b85f4a]">{error}</div>}

      {/* Product Info */}
      <div className="mb-5 rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <h3 className="mb-4 font-display text-[16px] font-bold text-[#423b65]">Informações do Produto</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[11px] font-semibold text-[#625b77]">Nome do Produto *</label>
            <input
              value={editForm.product_name}
              onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
              placeholder="Ex: Salada de Frango Agridoce"
              className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[13px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#625b77]">Valor de Cardápio (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editForm.cardapio_price}
              onChange={(e) => setEditForm({ ...editForm, cardapio_price: e.target.value })}
              placeholder="0,00"
              className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[13px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#625b77]">N. Porções</label>
            <input
              type="number"
              min="1"
              value={editForm.portions}
              onChange={(e) => setEditForm({ ...editForm, portions: e.target.value })}
              className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[13px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-[#625b77]">Vlr. Sugerido Consumidor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editForm.suggested_consumer_price}
              onChange={(e) => setEditForm({ ...editForm, suggested_consumer_price: e.target.value })}
              placeholder="0,00"
              className="h-11 w-full rounded-[12px] border border-[#e5e1ee] bg-[#fbfafc] px-3 text-[13px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
            />
          </div>
        </div>

        {/* Live cost summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[12px] bg-[#f8f7fc] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aaa5b6]">Custo Total</p>
            <p className="mt-0.5 font-display text-[15px] font-bold text-[#423b65]">{formatCurrency(calculatedTotal)}</p>
          </div>
          <div className="rounded-[12px] bg-[#f8f7fc] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aaa5b6]">Lucro Bruto</p>
            <p className={`mt-0.5 font-display text-[15px] font-bold ${calculatedGrossProfit >= 0 ? "text-[#2e7d32]" : "text-[#b85f4a]"}`}>{formatCurrency(calculatedGrossProfit)}</p>
          </div>
          <div className="rounded-[12px] bg-[#f8f7fc] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aaa5b6]">Mark Up</p>
            <p className="mt-0.5 font-display text-[15px] font-bold text-[#423b65]">{calculatedMarkUp.toFixed(1)}%</p>
          </div>
          <div className="rounded-[12px] bg-[#f8f7fc] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#aaa5b6]">Vlr. Por Porção</p>
            <p className="mt-0.5 font-display text-[15px] font-bold text-[#423b65]">{formatCurrency(calculatedCostPerPortion)}</p>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-5 rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-[#423b65]">Ingredientes</h3>
          <button onClick={addIngredient} className="flex items-center gap-1 rounded-[10px] bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] transition hover:bg-[#e6e2ff]">
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {draftIngredients.map((ing, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 rounded-[12px] border border-[#ebe7f0] bg-[#fbfafc] p-3 sm:grid-cols-7">
              <input
                value={ing.ingredient_name}
                onChange={(e) => updateIngredient(idx, "ingredient_name", e.target.value)}
                placeholder="Ingrediente"
                className="col-span-2 h-9 rounded-[9px] border border-[#e5e1ee] bg-white px-2.5 text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7] sm:col-span-2"
              />
              <select
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white px-2 text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input
                type="number"
                step="any"
                value={ing.liquid_quantity}
                onChange={(e) => updateIngredient(idx, "liquid_quantity", e.target.value)}
                placeholder="Qtd. Líq."
                className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white px-2.5 text-right text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <input
                type="number"
                step="any"
                value={ing.yield_percentage}
                onChange={(e) => updateIngredient(idx, "yield_percentage", e.target.value)}
                placeholder="Rend. %"
                className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white px-2.5 text-right text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <input
                type="number"
                step="any"
                value={ing.gross_quantity}
                onChange={(e) => updateIngredient(idx, "gross_quantity", e.target.value)}
                placeholder="Qtd. Bruta"
                className="h-9 rounded-[9px] border border-[#e5e1ee] bg-white px-2.5 text-right text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={ing.unit_value}
                  onChange={(e) => updateIngredient(idx, "unit_value", e.target.value)}
                  placeholder="Vlr. Unit."
                  className="h-9 w-full rounded-[9px] border border-[#e5e1ee] bg-white px-2.5 text-right text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
                />
                <button onClick={() => removeIngredient(idx)} className="rounded-lg p-1.5 text-[#aaa5b6] transition hover:bg-[#fff5f2] hover:text-[#b85f4a]">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {draftIngredients.length > 0 && (
          <div className="mt-3 flex justify-end">
            <p className="text-[12px] font-bold text-[#423b65]">
              Total: {formatCurrency(calculatedTotal)}
            </p>
          </div>
        )}
      </div>

      {/* Preparation Mode */}
      <div className="mb-5 rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-[#423b65]">Modo de Preparo</h3>
          <button onClick={addPrepStep} className="flex items-center gap-1 rounded-[10px] bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] transition hover:bg-[#e6e2ff]">
            <Plus size={13} /> Adicionar Passo
          </button>
        </div>
        <div className="space-y-2">
          {draftPrepSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6d5df5] text-[10px] font-bold text-white">{idx + 1}</span>
              <textarea
                value={step.description}
                onChange={(e) => setDraftPrepSteps((prev) => prev.map((s, i) => i === idx ? { ...s, description: e.target.value } : s))}
                placeholder={`Passo ${idx + 1} do preparo...`}
                rows={2}
                className="flex-1 resize-none rounded-[10px] border border-[#e5e1ee] bg-[#fbfafc] px-3 py-2 text-[12px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <button onClick={() => removePrepStep(idx)} className="mt-2 rounded-lg p-1.5 text-[#aaa5b6] transition hover:bg-[#fff5f2] hover:text-[#b85f4a]">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Utensils */}
      <div className="mb-5 rounded-[18px] border border-[#ebe7f0] bg-white p-5 shadow-[0_5px_14px_rgba(77,64,120,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold text-[#423b65]">Utensílios Necessários</h3>
          <button onClick={addUtensil} className="flex items-center gap-1 rounded-[10px] bg-[#f0edff] px-3 py-2 text-[11px] font-semibold text-[#6d5df5] transition hover:bg-[#e6e2ff]">
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {draftUtensils.map((ut, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={ut.utensil_name}
                onChange={(e) => setDraftUtensils((prev) => prev.map((u, i) => i === idx ? { ...u, utensil_name: e.target.value } : u))}
                placeholder="Nome do utensílio"
                className="h-9 flex-1 rounded-[9px] border border-[#e5e1ee] bg-[#fbfafc] px-2.5 text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <input
                type="number"
                min="1"
                value={ut.quantity}
                onChange={(e) => setDraftUtensils((prev) => prev.map((u, i) => i === idx ? { ...u, quantity: e.target.value } : u))}
                placeholder="Qtd"
                className="h-9 w-16 rounded-[9px] border border-[#e5e1ee] bg-[#fbfafc] px-2 text-right text-[11px] text-[#625b77] outline-none focus:border-[#bdb5f7]"
              />
              <button onClick={() => removeUtensil(idx)} className="rounded-lg p-1.5 text-[#aaa5b6] transition hover:bg-[#fff5f2] hover:text-[#b85f4a]">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
