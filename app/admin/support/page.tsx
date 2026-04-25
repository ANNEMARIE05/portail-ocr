'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, Search, Clock, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChargeurPage } from '@/components/admin/page-loader'
import {
  envoyerMessageTicketSupport,
  recupererMessagesTicketSupport,
  recupererTicketsSupport,
} from '@/lib/api/admin-service'
import { lireAdminIdStockage, lireDonneesProfilAdminSession } from '@/lib/api/session-client'
import {
  envoyerSurWebSocketTicket,
  expediteurIdDepuisPayloadWs,
  payloadsMessagesDepuisEvenementWebSocket,
  serialiserMessageWebSocketTicket,
  texteMessageDepuisPayloadWs,
  urlWebSocketTicketAdmin,
} from '@/lib/api/tickets-api'
import type { TicketSupport, MessageSupport } from '@/lib/types-admin'
import { formaterDateRelative, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageSupport() {
  const [estChargement, setEstChargement] = useState(true)
  const [tickets, setTickets] = useState<TicketSupport[]>([])
  const [ticketSelectionne, setTicketSelectionne] = useState<TicketSupport | null>(null)
  const [messages, setMessages] = useState<MessageSupport[]>([])
  const [chargementMessages, setChargementMessages] = useState(false)
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [recherche, setRecherche] = useState('')
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)
  /** Tickets déjà ouverts côté UI : on retire le point d’attente. */
  const [ticketsConsultes, setTicketsConsultes] = useState<Set<string>>(() => new Set())
  const refWs = useRef<WebSocket | null>(null)

  const marquerTicketConsulte = useCallback((id: string) => {
    setTicketsConsultes((prev) => {
      if (prev.has(id)) return prev
      return new Set([...prev, id])
    })
  }, [])

  const fermerWebSocket = useCallback(() => {
    if (refWs.current) {
      refWs.current.close()
      refWs.current = null
    }
  }, [])

  const connecterWebSocket = useCallback(
    (ticketId: string) => {
      fermerWebSocket()
      const url = urlWebSocketTicketAdmin(ticketId)
      if (!url) return
      try {
        const ws = new WebSocket(url)
        refWs.current = ws
        ws.onmessage = (evt) => {
          try {
            const fragments = payloadsMessagesDepuisEvenementWebSocket(String(evt.data))
            const adminId = lireAdminIdStockage()
            for (const data of fragments) {
              const expediteur = expediteurIdDepuisPayloadWs(data)
              if (adminId && expediteur === adminId) continue
              const texte = texteMessageDepuisPayloadWs(data)
              if (!texte.trim()) continue
              setMessages((prev) => [
                ...prev,
                {
                  id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                  ticketId,
                  auteurId: expediteur || 'user',
                  auteurNom: 'Utilisateur',
                  estAdmin: false,
                  contenu: texte,
                  dateEnvoi: new Date(),
                },
              ])
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    },
    [fermerWebSocket],
  )

  const chargerMessagesPourTicket = useCallback(
    async (ticket: TicketSupport) => {
      setChargementMessages(true)
      setErreurEnvoi(null)
      try {
        const reponse = await recupererMessagesTicketSupport(
          ticket.id,
          ticket.utilisateurId,
          ticket.utilisateurNom,
        )
        if (reponse.succes && reponse.donnees) {
          setMessages(reponse.donnees)
        } else {
          setMessages([])
        }
      } finally {
        setChargementMessages(false)
      }
    },
    [],
  )

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setEstChargement(true)
        const reponse = await recupererTicketsSupport()
        if (reponse.succes && reponse.donnees) {
          const donnees = reponse.donnees
          setTickets(donnees)
          if (donnees.length > 0) {
            const premier = donnees[0]
            setTicketSelectionne(premier)
            setTicketsConsultes((prev) => {
              if (prev.has(premier.id)) return prev
              return new Set([...prev, premier.id])
            })
            await chargerMessagesPourTicket(premier)
          }
        }
        setEstChargement(false)
      })()
    })
  }, [chargerMessagesPourTicket])

  useEffect(() => {
    if (!ticketSelectionne) {
      fermerWebSocket()
      return
    }
    connecterWebSocket(ticketSelectionne.id)
    return () => {
      fermerWebSocket()
    }
  }, [ticketSelectionne, connecterWebSocket, fermerWebSocket])

  const selectionnerTicket = async (ticket: TicketSupport) => {
    setTicketSelectionne(ticket)
    marquerTicketConsulte(ticket.id)
    await chargerMessagesPourTicket(ticket)
  }

  const envoyerMessage = async () => {
    const texte = nouveauMessage.trim()
    if (!texte || !ticketSelectionne) return
    setErreurEnvoi(null)
    const adminId = lireAdminIdStockage() ?? 'adm_local'
    const profil = lireDonneesProfilAdminSession()
    const nomAgent =
      `${profil.prenom} ${profil.nom}`.trim() || profil.email || profil.username || 'Support'
    const nouveau: MessageSupport = {
      id: `local_${Date.now()}`,
      ticketId: ticketSelectionne.id,
      auteurId: adminId,
      auteurNom: nomAgent,
      estAdmin: true,
      contenu: texte,
      dateEnvoi: new Date(),
    }
    setMessages((prev) => [...prev, nouveau])
    setNouveauMessage('')

    const rep = await envoyerMessageTicketSupport(ticketSelectionne.id, texte)
    if (!rep.succes) {
      setErreurEnvoi(rep.erreur ?? 'Envoi impossible.')
      setMessages((prev) => prev.filter((m) => m.id !== nouveau.id))
      return
    }

    const urlWs = urlWebSocketTicketAdmin(ticketSelectionne.id)
    if (!urlWs) return
    const corps = serialiserMessageWebSocketTicket(adminId, texte, {
      ticketId: ticketSelectionne.id,
      typeMessage: 'admin_message',
    })
    if (envoyerSurWebSocketTicket(refWs.current, corps)) return
    window.setTimeout(() => {
      void envoyerSurWebSocketTicket(refWs.current, corps)
    }, 1500)
  }

  const ticketsFiltres = tickets.filter(
    (t) =>
      t.sujet.toLowerCase().includes(recherche.toLowerCase()) ||
      t.utilisateurNom.toLowerCase().includes(recherche.toLowerCase()),
  )

  /** Fil affiché : messages API, ou à défaut le corps du ticket comme premier message utilisateur. */
  const messagesDiscussion = useMemo((): MessageSupport[] => {
    if (!ticketSelectionne) return messages
    if (messages.length > 0) return messages
    const corps = (ticketSelectionne.description ?? '').trim()
    if (!corps) return []
    return [
      {
        id: `ticket_${ticketSelectionne.id}_description`,
        ticketId: ticketSelectionne.id,
        auteurId: ticketSelectionne.utilisateurId,
        auteurNom: ticketSelectionne.utilisateurNom,
        estAdmin: false,
        contenu: corps,
        dateEnvoi: ticketSelectionne.dateCreation,
      },
    ]
  }, [messages, ticketSelectionne])

  const getStatutStyle = (statut: TicketSupport['statut']) => {
    switch (statut) {
      case 'ouvert':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'en-cours':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'resolu':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'ferme':
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (estChargement) {
    return <ChargeurPage avecTable />
  }

  /** Retours à la ligne et contrainte flex : même règle pour titres, listes, bulles */
  const limiteTexte = 'min-w-0 max-w-full break-words'

  return (
    <div className="flex h-[calc(100vh-112px)] min-h-0 min-w-0 flex-col gap-3 overflow-hidden md:flex-row md:gap-6">
      {/* Liste des tickets */}
      <Card className="flex min-h-0 w-full shrink-0 flex-col gap-0 overflow-hidden border-border/40 py-0 shadow-sm max-md:max-h-[40vh] md:h-full md:max-w-md sm:w-[26rem]">
        <CardHeader className="shrink-0 border-b border-border/40 px-4 pb-3 pt-4 sm:pb-4 sm:pt-6">
          <CardTitle className={cn('text-sm font-semibold sm:text-base', limiteTexte)}>
            Tickets de support
          </CardTitle>
          <CardDescription className={limiteTexte}>
            File d&apos;attente — statut par ticket.
          </CardDescription>
          <div className="relative mt-2 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="min-w-0 pl-9"
            />
          </div>
        </CardHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {ticketsFiltres.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => void selectionnerTicket(ticket)}
                className={cn(
                  'w-full min-w-0 rounded-lg p-3 text-left transition-colors',
                  ticketSelectionne?.id === ticket.id ? 'bg-slate-100' : 'hover:bg-slate-50',
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className={cn('min-w-0 flex-1 space-y-1', limiteTexte)}>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn('font-medium text-foreground line-clamp-2', limiteTexte)}>
                        {ticket.utilisateurNom}
                      </span>
                    </div>
                    <p className={cn('text-sm text-muted-foreground line-clamp-2', limiteTexte)}>
                      {ticket.sujet}
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formaterDateRelative(ticket.dernierMessage)}
                      </span>
                      <span className="shrink-0">•</span>
                      <Badge
                        variant="outline"
                        className={cn('max-w-full shrink-0 truncate text-xs', getStatutStyle(ticket.statut))}
                      >
                        {ticket.statut === 'en-cours'
                          ? 'En cours'
                          : ticket.statut.charAt(0).toUpperCase() + ticket.statut.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {ticket.statut === 'ouvert' && !ticketsConsultes.has(ticket.id) && (
                    <span
                      className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-500"
                      aria-hidden
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Conversation */}
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden border-border/40 py-0 shadow-sm">
        {ticketSelectionne ? (
          <>
            {/* En-tête du ticket */}
            <CardHeader className="shrink-0 border-b border-border/40 px-4 pt-6 sm:px-6">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className={cn('min-w-0 flex-1 space-y-1', limiteTexte)}>
                  <CardTitle className={cn('text-base', limiteTexte)}>{ticketSelectionne.sujet}</CardTitle>
                  <CardDescription className={limiteTexte}>
                    Fil de discussion avec l&apos;utilisateur
                  </CardDescription>
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground',
                      limiteTexte,
                    )}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">{ticketSelectionne.utilisateurNom}</span>
                    <span className="shrink-0">•</span>
                    <span className="min-w-0 break-all">{ticketSelectionne.utilisateurEmail}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <Badge
                    variant="outline"
                    className={cn('max-w-full truncate', getStatutStyle(ticketSelectionne.statut))}
                  >
                    {ticketSelectionne.statut === 'en-cours'
                      ? 'En cours'
                      : ticketSelectionne.statut.charAt(0).toUpperCase() +
                        ticketSelectionne.statut.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Messages : scroll natif (flex) — Radix ScrollArea sans hauteur explicite masquait le fil. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-4">
                {chargementMessages ? (
                  <p className="text-sm text-muted-foreground">Chargement des messages…</p>
                ) : messagesDiscussion.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun message pour ce ticket. Répondez ci-dessous pour démarrer la discussion.
                  </p>
                ) : (
                  messagesDiscussion.map((message) => (
                    <div
                      key={message.id}
                      className={cn('flex min-w-0 gap-3', message.estAdmin && 'flex-row-reverse')}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={cn(
                            'text-sm',
                            message.estAdmin
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {genererInitiales(
                            message.auteurNom.split(' ')[0],
                            message.auteurNom.split(' ')[1] || '',
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          limiteTexte,
                          'w-fit max-w-[min(80%,42rem)] rounded-lg p-3',
                          message.estAdmin
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-foreground',
                        )}
                      >
                        <p className={cn('text-sm', limiteTexte)}>{message.contenu}</p>
                        <p
                          className={cn(
                            'mt-1 text-xs',
                            message.estAdmin ? 'text-blue-200' : 'text-muted-foreground',
                            limiteTexte,
                          )}
                        >
                          {formaterDateRelative(message.dateEnvoi)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zone de réponse */}
            <div className="shrink-0 border-t border-border/40 p-4">
              {erreurEnvoi ? (
                <p className="mb-2 text-sm text-destructive">{erreurEnvoi}</p>
              ) : null}
              <div className="flex min-w-0 gap-3">
                <Input
                  placeholder="Écrivez votre réponse..."
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void envoyerMessage()}
                  className="min-w-0 flex-1"
                />
                <Button
                  className="shrink-0"
                  type="button"
                  onClick={() => void envoyerMessage()}
                  disabled={!nouveauMessage.trim() || chargementMessages}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-4 py-6">
            <div className={cn('max-w-md text-center', limiteTexte)}>
              <MessageSquare className="mx-auto h-12 w-12 shrink-0 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun ticket sélectionné</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sélectionnez un ticket pour voir la conversation
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
