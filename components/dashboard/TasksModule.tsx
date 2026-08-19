"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Eye, EyeOff, Loader2, CalendarClock, Check, Flag } from "lucide-react";
import { dueDateFromOffset, isOverdue, TASK_PRIORITIES, TASK_PRIORITY_LABELS, type EventTask, type TaskPriority, type TaskStatus } from "@/lib/planner";

// Checklist do evento — área de gestão, exclusiva de contas de agência.
// As tarefas guardam a data-limite e, quando definido, o número de dias antes
// do casamento de onde essa data saiu; é isso que permite recalcular a
// checklist inteira se a data do evento mudar, em vez de a reescrever à mão.

interface Props {
  invitationId: string;
  eventDate: string | null;
  canEdit: boolean;
  /** Equipa da agência vê tudo; o casal só vê as tarefas partilhadas. */
  isAgency: boolean;
}

const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "done"];
const STATUS_LABELS: Record<TaskStatus, string> = { todo: "Por fazer", doing: "Em curso", done: "Feito" };
// Cor da bandeirinha de prioridade — clicar percorre baixa → normal → alta.
const PRIORITY_COLOR: Record<TaskPriority, string> = { baixa: "text-gray-300", normal: "text-gold-soft", alta: "text-red-500" };

export default function TasksModule({ invitationId, eventDate, canEdit, isAgency }: Props) {
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("event_tasks")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("due_date", { nullsFirst: false })
      .order("sort_order");
    setTasks((data as EventTask[]) || []);
    setLoading(false);
  }, [invitationId]);

  useEffect(() => { load(); }, [load]);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!canEdit || !title) return;
    setAdding(true);
    const { data } = await supabase
      .from("event_tasks")
      .insert([{
        invitation_id: invitationId,
        title,
        status: "todo",
        // Privado por omissão: o trabalho de bastidores da agência não deve
        // aparecer ao casal sem uma decisão explícita.
        visibility: isAgency ? "agency" : "shared",
        sort_order: tasks.length,
      }])
      .select("*")
      .single();
    if (data) setTasks(prev => [...prev, data as EventTask]);
    setNewTitle("");
    setAdding(false);
  };

  const patchTask = async (id: string, patch: Partial<EventTask>) => {
    if (!canEdit) return;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from("event_tasks").update(patch).eq("id", id);
  };

  const removeTask = async (id: string) => {
    if (!canEdit) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("event_tasks").delete().eq("id", id);
  };

  const cycleStatus = (t: EventTask) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(t.status) + 1) % STATUS_ORDER.length];
    patchTask(t.id, { status: next });
  };

  const cyclePriority = (t: EventTask) => {
    const next = TASK_PRIORITIES[(TASK_PRIORITIES.indexOf(t.priority) + 1) % TASK_PRIORITIES.length];
    patchTask(t.id, { priority: next });
  };

  /** Reaplica "N dias antes do casamento" a todas as tarefas que tenham desvio. */
  const recalcDueDates = async () => {
    if (!canEdit || !eventDate) return;
    const affected = tasks.filter(t => t.due_offset_days !== null && t.due_offset_days !== undefined);
    if (affected.length === 0) return;
    setRecalculating(true);
    await Promise.all(
      affected.map(t => {
        const due = dueDateFromOffset(eventDate, t.due_offset_days);
        setTasks(prev => prev.map(x => (x.id === t.id ? { ...x, due_date: due } : x)));
        return supabase.from("event_tasks").update({ due_date: due }).eq("id", t.id);
      })
    );
    setRecalculating(false);
  };

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-brand transition-colors disabled:opacity-60";
  const done = tasks.filter(t => t.status === "done").length;
  const overdueCount = tasks.filter(t => isOverdue(t)).length;
  const highPriorityCount = tasks.filter(t => t.priority === "alta" && t.status !== "done").length;
  const hasOffsets = tasks.some(t => t.due_offset_days !== null && t.due_offset_days !== undefined);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand/40" /></div>;
  }

  return (
    <div className="space-y-8 pb-16 text-left animate-in fade-in duration-500 font-montserrat">
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-md border border-gray-100">

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h3 className="font-serif text-3xl text-brand">Tarefas</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2 font-bold">
              {tasks.length > 0 ? `${done} de ${tasks.length} concluídas` : "Checklist do evento"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-full">
                {overdueCount} em atraso
              </span>
            )}
            {highPriorityCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand bg-gold-soft/10 border border-gold-soft/40 px-3 py-2 rounded-full">
                <Flag size={11} fill="currentColor" /> {highPriorityCount} prioridade alta
              </span>
            )}
            {hasOffsets && eventDate && canEdit && (
              <button
                onClick={recalcDueDates}
                disabled={recalculating}
                title="Reaplica os prazos a partir da data do casamento"
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-brand hover:border-gold-soft transition-all disabled:opacity-50"
              >
                <CalendarClock size={13} /> Recalcular prazos
              </button>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2 mb-6">
            <input
              className={inputCls}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTask(); }}
              placeholder="Nova tarefa — ex: Confirmar número final ao catering"
            />
            <button
              onClick={addTask}
              disabled={adding || !newTitle.trim()}
              className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-40 shrink-0"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            Sem tarefas. Comece pelas que se repetem em todos os casamentos.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => {
              const late = isOverdue(t);
              return (
                <div
                  key={t.id}
                  className={`flex flex-wrap items-center gap-3 p-3 rounded-2xl border transition-colors ${
                    t.status === "done"
                      ? "border-gray-100 bg-gray-50/60"
                      : late
                        ? "border-red-100 bg-red-50/40"
                        : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => cycleStatus(t)}
                    disabled={!canEdit}
                    title={STATUS_LABELS[t.status]}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all disabled:opacity-50 ${
                      t.status === "done"
                        ? "bg-green-500 border-green-500 text-white"
                        : t.status === "doing"
                          ? "border-brand bg-brand/10"
                          : "border-gray-200 hover:border-brand"
                    }`}
                  >
                    {t.status === "done" && <Check size={14} />}
                    {t.status === "doing" && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </button>

                  <button
                    onClick={() => cyclePriority(t)}
                    disabled={!canEdit}
                    title={`Prioridade: ${TASK_PRIORITY_LABELS[t.priority]}`}
                    className={`shrink-0 disabled:opacity-50 transition-colors ${PRIORITY_COLOR[t.priority]}`}
                  >
                    <Flag size={14} fill={t.priority === "alta" ? "currentColor" : "none"} />
                  </button>

                  <input
                    className={`flex-1 min-w-[160px] bg-transparent border-none text-sm outline-none px-0 ${
                      t.status === "done" ? "line-through text-gray-400" : "text-ink font-medium"
                    }`}
                    defaultValue={t.title}
                    disabled={!canEdit}
                    onBlur={e => patchTask(t.id, { title: e.target.value })}
                  />

                  <input
                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center text-gray-500 outline-none focus:border-brand tabular-nums disabled:opacity-60"
                    type="number"
                    placeholder="dias"
                    title="Dias antes do casamento"
                    disabled={!canEdit}
                    defaultValue={t.due_offset_days ?? ""}
                    onBlur={e => {
                      const raw = e.target.value.trim();
                      const offset = raw === "" ? null : parseInt(raw);
                      patchTask(t.id, {
                        due_offset_days: offset,
                        ...(offset !== null && eventDate ? { due_date: dueDateFromOffset(eventDate, offset) } : {}),
                      });
                    }}
                  />

                  <input
                    className={`w-36 bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand disabled:opacity-60 ${
                      late ? "border-red-200 text-red-600" : "border-gray-200 text-gray-500"
                    }`}
                    type="date"
                    disabled={!canEdit}
                    value={t.due_date || ""}
                    onChange={e => patchTask(t.id, { due_date: e.target.value || null })}
                  />

                  {isAgency && (
                    <button
                      onClick={() => patchTask(t.id, { visibility: t.visibility === "shared" ? "agency" : "shared" })}
                      disabled={!canEdit}
                      title={t.visibility === "shared" ? "Visível para o casal" : "Privado da agência"}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-brand hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {t.visibility === "shared" ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => removeTask(t.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-500 hover:text-white transition-colors shrink-0"
                      aria-label="Remover tarefa"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
