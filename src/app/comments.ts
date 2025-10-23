// src/app/comments.ts
import { supabase } from "@/lib/supabase"

export interface TicketComment {
  id: string
  ticket_id: string
  user_email: string
  content: string
  created_at: string
  updated_at: string
}

export type CommentInsert = {
  ticket_id: string
  user_email: string
  content: string
}

export type CommentUpdate = {
  content: string
}

/**
 * Obtiene todos los comentarios de un ticket, ordenados por más reciente primero
 */
export async function getComments(ticketId: string): Promise<TicketComment[]> {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TicketComment[]
}

/**
 * Crea un nuevo comentario en un ticket
 */
export async function createComment(input: CommentInsert): Promise<TicketComment> {
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert({
      ticket_id: input.ticket_id,
      user_email: input.user_email,
      content: input.content,
    })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as TicketComment
}

/**
 * Actualiza un comentario existente
 */
export async function updateComment(
  id: string,
  patch: CommentUpdate
): Promise<TicketComment> {
  const { data, error } = await supabase
    .from("ticket_comments")
    .update({
      content: patch.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as TicketComment
}

/**
 * Elimina un comentario
 */
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from("ticket_comments")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}

/**
 * Suscripción en tiempo real a cambios en comentarios de un ticket
 */
export function subscribeToComments(
  ticketId: string,
  onChange: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE"
    new?: TicketComment
    old?: TicketComment
  }) => void
): () => void {
  const channel = supabase
    .channel(`ticket_comments_${ticketId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ticket_comments",
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        const { eventType, new: n, old } = payload as any
        onChange({
          eventType: eventType as "INSERT" | "UPDATE" | "DELETE",
          new: n as TicketComment | undefined,
          old: old as TicketComment | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
