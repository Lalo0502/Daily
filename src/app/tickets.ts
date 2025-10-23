import { supabase } from "@/lib/supabase"

export type TicketStatus =
  | "assigned"
  | "pending"
  | "researching"
  | "work_in_progress"
  | "escalated"
  | "resolved"

export const TICKET_STATUS: TicketStatus[] = [
  "assigned",
  "pending",
  "researching",
  "work_in_progress",
  "escalated",
  "resolved",
]

export type CtiKind = "hardware" | "networking"
export const CTI_KINDS: CtiKind[] = ["hardware", "networking"]

export interface TicketRow {
  id: string
  external_id: string
  ticket_name: string
  status: TicketStatus
  assignee: string
  cti: CtiKind
  notes: string | null
  last_activity_at: string // timestamptz
  created_at: string
  updated_at: string
  // Si activaste RLS con owner:
  // owner?: string
}

export type TicketInsert = {
  external_id: string
  ticket_name: string
  status?: TicketStatus
  assignee: string
  cti: CtiKind
  notes?: string | null
  last_activity_at?: string
}

export type TicketUpdate = Partial<
  Omit<TicketRow, "id" | "created_at" | "updated_at">
> & { last_activity_at?: string }

/** Parámetros para listados/paginación/ordenamiento server-side */
export type ListOptions = {
  q?: string
  status?: TicketStatus | "all"
  cti?: CtiKind | "all"
  assignee?: string
  page?: number // 1-based
  pageSize?: number // default 25
  sortBy?:
    | "external_id"
    | "ticket_name"
    | "assignee"
    | "status"
    | "cti"
    | "last_activity_at"
    | "updated_at"
    | "created_at"
  sortDir?: "asc" | "desc"
}

/** Mapea sort seguro a columnas reales */
function safeSort(col?: ListOptions["sortBy"]) {
  const allowed = new Set([
    "external_id",
    "ticket_name",
    "assignee",
    "status",
    "cti",
    "last_activity_at",
    "updated_at",
    "created_at",
  ])
  return allowed.has(col as string) ? (col as string) : "last_activity_at"
}

/** Obtiene tickets desde Supabase con filtros y paginación (server-side). */
export async function getTickets(opts: ListOptions = {}): Promise<TicketRow[]> {
  const {
    q = "",
    status = "all",
    cti = "all",
    assignee = "",
    page = 1,
    pageSize = 25,
    sortBy,
    sortDir = "desc",
  } = opts

  const from = Math.max(0, (page - 1) * pageSize)
  const to = from + pageSize - 1
  const col = safeSort(sortBy)

  let query = supabase
    .from("tickets")
    .select("*", { count: "exact" })
    .order(col, { ascending: sortDir === "asc", nullsFirst: false })
    .range(from, to)

  if (status !== "all") query = query.eq("status", status)
  if (cti !== "all") query = query.eq("cti", cti)
  if (assignee) query = query.ilike("assignee", `%${assignee}%`)

  if (q) {
    // Busca en external_id, ticket_name y notes
    query = query.or(
      `external_id.ilike.%${q}%,ticket_name.ilike.%${q}%,notes.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as TicketRow[]
}

/** Crea un ticket (usa defaults de la BD para status/fechas). */
export async function createTicket(input: TicketInsert): Promise<TicketRow> {
  const payload: TicketInsert = {
    ...input,
    // Puedes decidir si forzar last_activity_at aquí:
    last_activity_at: input.last_activity_at ?? new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert(payload)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as TicketRow
}

/** Actualiza un ticket por id (parcial). */
export async function updateTicket(
  id: string,
  patch: TicketUpdate
): Promise<TicketRow> {
  const payload: TicketUpdate = {
    ...patch,
    // Opcional: actualizar actividad al tocar el ticket
    last_activity_at: patch.last_activity_at ?? new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("tickets")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as TicketRow
}

/** Elimina un ticket por id. */
export async function deleteTicket(id: string): Promise<void> {
  const { error } = await supabase.from("tickets").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

/**
 * Suscripción en tiempo real a cambios en tickets.
 * Devuelve una función para desuscribirte.
 */
export function subscribeTickets(
  onChange: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE"
    new?: TicketRow
    old?: TicketRow
  }) => void
): () => void {
  const channel = supabase
    .channel("tickets_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tickets" },
      (payload) => {
        const { eventType, new: n, old } = payload as any
        onChange({
          eventType: eventType as "INSERT" | "UPDATE" | "DELETE",
          new: n as TicketRow | undefined,
          old: old as TicketRow | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/** Utilidad para upsert en lote (p. ej. importar CSV) */
export async function upsertTickets(rows: TicketInsert[]): Promise<number> {
  if (!rows.length) return 0
  // upsert por external_id (debe ser UNIQUE en la tabla)
  const { data, error } = await supabase
    .from("tickets")
    .upsert(
      rows.map((r) => ({
        ...r,
        last_activity_at: r.last_activity_at ?? new Date().toISOString(),
      })),
      { onConflict: "external_id" }
    )
    .select("id")

  if (error) throw new Error(error.message)
  return data?.length ?? 0
}
