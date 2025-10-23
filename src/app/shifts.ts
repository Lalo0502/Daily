// src/app/shifts.ts
import { supabase } from "@/lib/supabase"
import type { TicketRow } from "./tickets"

export interface Shift {
  id: string
  shift_date: string // DATE (YYYY-MM-DD)
  started_at: string // TIMESTAMPTZ
  ended_at: string | null // TIMESTAMPTZ - null if active
  user_email: string
  status: "active" | "completed"
  notes: string | null
  created_at: string
}

export interface ShiftTicket {
  id: string
  shift_id: string
  ticket_id: string
  priority: number
  completed: boolean
  notes: string | null
  added_at: string
  completed_at: string | null
}

export interface ShiftTicketWithDetails extends ShiftTicket {
  ticket: TicketRow
}

export type ShiftInsert = {
  shift_date: string
  started_at: string
  user_email: string
  notes?: string | null
}

export type ShiftUpdate = {
  ended_at?: string
  status?: "active" | "completed"
  notes?: string | null
}

export type ShiftTicketInsert = {
  shift_id: string
  ticket_id: string
  priority?: number
  notes?: string | null
}

/**
 * Obtiene el shift_date actual basado en la hora
 * Si son antes de las 7 AM, pertenece al turno del día anterior
 */
export function getCurrentShiftDate(): string {
  const now = new Date()
  const hour = now.getHours()
  
  if (hour < 7) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }
  
  return now.toISOString().split('T')[0]
}

/**
 * Obtiene el turno activo del usuario
 */
export async function getActiveShift(userEmail: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_email", userEmail)
    .eq("status", "active")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // No rows
    throw new Error(error.message)
  }
  
  return data as Shift
}

/**
 * Inicia un nuevo turno
 */
export async function startShift(userEmail: string, notes?: string): Promise<Shift> {
  const shiftDate = getCurrentShiftDate()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      shift_date: shiftDate,
      started_at: now,
      user_email: userEmail,
      status: "active",
      notes: notes || null,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as Shift
}

/**
 * Finaliza un turno
 */
export async function endShift(shiftId: string, notes?: string): Promise<Shift> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("shifts")
    .update({
      ended_at: now,
      status: "completed",
      notes: notes || null,
    })
    .eq("id", shiftId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as Shift
}

/**
 * Obtiene todos los turnos de un usuario
 */
export async function getShifts(userEmail: string, limit = 30): Promise<Shift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_email", userEmail)
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Shift[]
}

/**
 * Obtiene los tickets de un turno específico con detalles
 */
export async function getShiftTickets(shiftId: string): Promise<ShiftTicketWithDetails[]> {
  const { data, error } = await supabase
    .from("shift_tickets")
    .select(`
      *,
      ticket:tickets(*)
    `)
    .eq("shift_id", shiftId)
    .order("priority", { ascending: false })
    .order("added_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ShiftTicketWithDetails[]
}

/**
 * Agrega un ticket a un turno
 */
export async function addTicketToShift(input: ShiftTicketInsert): Promise<ShiftTicket> {
  const { data, error } = await supabase
    .from("shift_tickets")
    .insert({
      shift_id: input.shift_id,
      ticket_id: input.ticket_id,
      priority: input.priority ?? 0,
      notes: input.notes || null,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as ShiftTicket
}

/**
 * Marca un ticket del turno como completado
 */
export async function completeShiftTicket(shiftTicketId: string): Promise<ShiftTicket> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("shift_tickets")
    .update({
      completed: true,
      completed_at: now,
    })
    .eq("id", shiftTicketId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as ShiftTicket
}

/**
 * Desmarca un ticket del turno como no completado
 */
export async function uncompleteShiftTicket(shiftTicketId: string): Promise<ShiftTicket> {
  const { data, error } = await supabase
    .from("shift_tickets")
    .update({
      completed: false,
      completed_at: null,
    })
    .eq("id", shiftTicketId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as ShiftTicket
}

/**
 * Elimina un ticket de un turno
 */
export async function removeTicketFromShift(shiftTicketId: string): Promise<void> {
  const { error } = await supabase
    .from("shift_tickets")
    .delete()
    .eq("id", shiftTicketId)

  if (error) throw new Error(error.message)
}

/**
 * Actualiza la prioridad de un ticket en el turno
 */
export async function updateShiftTicketPriority(
  shiftTicketId: string,
  priority: number
): Promise<ShiftTicket> {
  const { data, error } = await supabase
    .from("shift_tickets")
    .update({ priority })
    .eq("id", shiftTicketId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as ShiftTicket
}

/**
 * Calcula la duración de un turno en horas
 */
export function getShiftDuration(shift: Shift): string {
  const start = new Date(shift.started_at)
  const end = shift.ended_at ? new Date(shift.ended_at) : new Date()
  const diffMs = end.getTime() - start.getTime()
  
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  
  return `${hours}h ${minutes}m`
}

/**
 * Suscripción en tiempo real a cambios en shift_tickets
 */
export function subscribeToShiftTickets(
  shiftId: string,
  onChange: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE"
    new?: ShiftTicket
    old?: ShiftTicket
  }) => void
): () => void {
  const channel = supabase
    .channel(`shift_tickets_${shiftId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shift_tickets",
        filter: `shift_id=eq.${shiftId}`,
      },
      (payload) => {
        const { eventType, new: n, old } = payload as any
        onChange({
          eventType: eventType as "INSERT" | "UPDATE" | "DELETE",
          new: n as ShiftTicket | undefined,
          old: old as ShiftTicket | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
