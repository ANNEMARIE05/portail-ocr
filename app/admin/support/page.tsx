'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Search, Clock, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgePriorite } from '@/components/admin/status-badge'
import { recupererTicketsSupport } from '@/lib/api/admin-service'
import { ticketsSupportMock, messagesSupportMock } from '@/lib/mock/donnees-transactions'
import type { TicketSupport, MessageSupport } from '@/lib/types-admin'
import { formaterDateRelative, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageSupport() {
  const [estChargement, setEstChargement] = useState(true)
  const [tickets, setTickets] = useState<TicketSupport[]>([])
  const [ticketSelectionne, setTicketSelectionne] = useState<TicketSupport | null>(null)
  const [messages, setMessages] = useState<MessageSupport[]>([])
  const [nouveauMessage, setNouveauMessage] = useState('')
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererTicketsSupport()
      if (reponse.succes && reponse.donnees) {
        const donnees = reponse.donnees
        setTickets(donnees)
        if (donnees.length > 0) {
          setTicketSelectionne(donnees[0])
          setMessages(messagesSupportMock.filter((m) => m.ticketId === donnees[0].id))
        }
      }
      setEstChargement(false)
    }
    chargerDonnees()
  }, [])

  const selectionnerTicket = (ticket: TicketSupport) => {
    setTicketSelectionne(ticket)
    setMessages(messagesSupportMock.filter((m) => m.ticketId === ticket.id))
  }

  const envoyerMessage = () => {
    if (!nouveauMessage.trim() || !ticketSelectionne) return
    
    const nouveau: MessageSupport = {
      id: `msg_${Date.now()}`,
      ticketId: ticketSelectionne.id,
      auteurId: 'adm_001',
      auteurNom: 'Jean-Pierre Durand',
      estAdmin: true,
      contenu: nouveauMessage,
      dateEnvoi: new Date(),
    }
    
    setMessages((prev) => [...prev, nouveau])
    setNouveauMessage('')
  }

  const ticketsFiltres = tickets.filter(
    (t) =>
      t.sujet.toLowerCase().includes(recherche.toLowerCase()) ||
      t.utilisateurNom.toLowerCase().includes(recherche.toLowerCase())
  )

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

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6">
      {/* Liste des tickets */}
      <Card className="w-96 shrink-0 border-border/40 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">Tickets de support</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="space-y-1 p-2">
            {ticketsFiltres.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => selectionnerTicket(ticket)}
                className={cn(
                  'w-full rounded-lg p-3 text-left transition-colors',
                  ticketSelectionne?.id === ticket.id
                    ? 'bg-slate-100'
                    : 'hover:bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground line-clamp-1">
                        {ticket.utilisateurNom}
                      </span>
                      <BadgePriorite priorite={ticket.priorite} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.sujet}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formaterDateRelative(ticket.dernierMessage)}
                      <span className="mx-1">•</span>
                      <Badge variant="outline" className={cn('text-xs', getStatutStyle(ticket.statut))}>
                        {ticket.statut === 'en-cours' ? 'En cours' : ticket.statut.charAt(0).toUpperCase() + ticket.statut.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {ticket.statut === 'ouvert' && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Conversation */}
      <Card className="flex flex-1 flex-col border-border/40 shadow-sm">
        {ticketSelectionne ? (
          <>
            {/* En-tête du ticket */}
            <CardHeader className="border-b border-border/40">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{ticketSelectionne.sujet}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {ticketSelectionne.utilisateurNom}
                    <span className="mx-1">•</span>
                    {ticketSelectionne.utilisateurEmail}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BadgePriorite priorite={ticketSelectionne.priorite} />
                  <Badge variant="outline" className={getStatutStyle(ticketSelectionne.statut)}>
                    {ticketSelectionne.statut === 'en-cours' ? 'En cours' : ticketSelectionne.statut.charAt(0).toUpperCase() + ticketSelectionne.statut.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.estAdmin && 'flex-row-reverse'
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          'text-sm',
                          message.estAdmin
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {genererInitiales(
                          message.auteurNom.split(' ')[0],
                          message.auteurNom.split(' ')[1] || ''
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg p-3',
                        message.estAdmin
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-foreground'
                      )}
                    >
                      <p className="text-sm">{message.contenu}</p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          message.estAdmin ? 'text-blue-200' : 'text-muted-foreground'
                        )}
                      >
                        {formaterDateRelative(message.dateEnvoi)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Zone de réponse */}
            <div className="border-t border-border/40 p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Écrivez votre réponse..."
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && envoyerMessage()}
                  className="flex-1"
                />
                <Button onClick={envoyerMessage} disabled={!nouveauMessage.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
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
