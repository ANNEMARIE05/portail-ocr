'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Loader2, Plus, RefreshCw, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  envoyerSurWebSocketTicket,
  estApiTicketsRestActive,
  expediteurIdDepuisPayloadWs,
  lireIdUtilisateurStockage,
  payloadsMessagesDepuisEvenementWebSocket,
  serialiserMessageWebSocketTicket,
  texteMessageDepuisPayloadWs,
  ticketsApiCreer,
  ticketsApiEnvoyerMessage,
  ticketsApiFermer,
  ticketsApiListerMessages,
  ticketsApiListerPourUtilisateur,
  urlWebSocketTicketUtilisateur,
} from '@/lib/api/tickets-api'
import { lireEmailUtilisateurStockage } from '@/lib/api/session-client'
import type { MessageTicket, TicketSupportUser } from '@/lib/types-user'
import type { ColonneTable, ConfigPagination } from '@/lib/types-admin'
import { OPTIONS_ELEMENTS_PAR_PAGE_TICKETS } from '@/lib/constants-pagination'
import { formaterDateHeure } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

function configStatutTicket(statut: TicketSupportUser['statut']) {
  switch (statut) {
    case 'ouvert':
      return { label: 'Ouvert', classe: 'bg-blue-50 text-blue-700' }
    case 'en-cours':
      return { label: 'En cours', classe: 'bg-amber-50 text-amber-700' }
    case 'resolu':
      return { label: 'Resolu', classe: 'bg-emerald-50 text-emerald-700' }
    case 'ferme':
      return { label: 'Ferme', classe: 'bg-slate-100 text-slate-500' }
  }
}

function ticketPeutEtreCloture(t: TicketSupportUser): boolean {
  const brut = (t.statutBrutApi ?? '').toUpperCase()
  if (brut === 'CLOSED' || brut === 'CLOSE') return false
  if (t.statut === 'resolu' || t.statut === 'ferme') return false
  if (brut === 'OPEN') return true
  return t.statut === 'ouvert' || t.statut === 'en-cours'
}

export default function PageAssistance() {
  const apiRestActive = estApiTicketsRestActive()

  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [estChargement, setEstChargement] = useState(true)
  const [loadingRetry, setLoadingRetry] = useState(false)
  const [erreurListe, setErreurListe] = useState<string | null>(null)

  const [ticketsComplets, setTicketsComplets] = useState<TicketSupportUser[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null)

  const [ticketModal, setTicketModal] = useState<TicketSupportUser | null>(null)
  const [messagesChat, setMessagesChat] = useState<MessageTicket[]>([])
  const [saisieMessage, setSaisieMessage] = useState('')
  const [chargementMessages, setChargementMessages] = useState(false)
  const [fermetureEnCours, setFermetureEnCours] = useState(false)
  const refWs = useRef<WebSocket | null>(null)
  const refScrollFin = useRef<HTMLDivElement | null>(null)
  const [emailProfil, setEmailProfil] = useState<string | null>(null)

  useEffect(() => {
    setEmailProfil(lireEmailUtilisateurStockage())
  }, [])

  const ticketsFiltres = useMemo(() => {
    let liste = [...ticketsComplets]
    const q = recherche.trim().toLowerCase()
    if (q) {
      const emailQ = (emailProfil ?? '').toLowerCase()
      liste = liste.filter(
        (t) =>
          t.sujet.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (emailQ && emailQ.includes(q)),
      )
    }
    if (apiRestActive) {
      liste.sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime())
    }
    return liste
  }, [ticketsComplets, recherche, apiRestActive, emailProfil])

  const ticketsPage = useMemo(() => {
    if (apiRestActive) {
      const total = ticketsFiltres.length
      const debut = (pagination.page - 1) * pagination.parPage
      return { lignes: ticketsFiltres.slice(debut, debut + pagination.parPage), total }
    }
    return { lignes: ticketsFiltres, total: pagination.total }
  }, [apiRestActive, ticketsFiltres, pagination.page, pagination.parPage, pagination.total])

  const fermerWebSocket = useCallback(() => {
    if (refWs.current) {
      refWs.current.close()
      refWs.current = null
    }
  }, [])

  const connecterWebSocket = useCallback(
    (ticketId: string) => {
      fermerWebSocket()
      const url = urlWebSocketTicketUtilisateur(ticketId)
      if (!url) return
      try {
        const ws = new WebSocket(url)
        refWs.current = ws
        ws.onmessage = (evt) => {
          try {
            const fragments = payloadsMessagesDepuisEvenementWebSocket(String(evt.data))
            const uid = lireIdUtilisateurStockage()
            for (const data of fragments) {
              const expediteur = expediteurIdDepuisPayloadWs(data)
              if (uid && expediteur === uid) continue
              const texte = texteMessageDepuisPayloadWs(data)
              if (!texte.trim()) continue
              setMessagesChat((prev) => [
                ...prev,
                {
                  id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                  ticketId,
                  auteur: 'support',
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

  const chargerConversationsApi = useCallback(async () => {
    setEstChargement(true)
    setErreurListe(null)
    try {
      const rep = await ticketsApiListerPourUtilisateur()
      if (!rep.ok) {
        setErreurListe(rep.erreur ?? 'Chargement impossible')
        setTicketsComplets([])
        setPagination((p) => ({ ...p, total: 0 }))
      } else {
        const liste = rep.tickets ?? []
        setTicketsComplets(liste)
        setPagination((p) => {
          const total = liste.length
          const maxPage = Math.max(1, Math.ceil(total / p.parPage) || 1)
          return { ...p, total, page: Math.min(p.page, maxPage) }
        })
      }
    } finally {
      setEstChargement(false)
      setLoadingRetry(false)
    }
  }, [])

  useEffect(() => {
    if (apiRestActive) {
      queueMicrotask(() => {
        void chargerConversationsApi()
      })
      return
    }
    setEstChargement(true)
    setErreurListe(
      "L'API tickets n'est pas configurée (URL d'API et préfixe service utilisateur).",
    )
    setTicketsComplets([])
    setPagination((p) => ({ ...p, total: 0, page: 1 }))
    setEstChargement(false)
    setLoadingRetry(false)
  }, [apiRestActive, chargerConversationsApi])

  useEffect(() => {
    if (!ticketModal) {
      fermerWebSocket()
      return
    }
    connecterWebSocket(ticketModal.id)
    return () => {
      fermerWebSocket()
    }
  }, [ticketModal, connecterWebSocket, fermerWebSocket])

  useEffect(() => {
    refScrollFin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesChat])

  const ouvrirConversation = useCallback(
    async (t: TicketSupportUser) => {
      setTicketModal(t)
      setSaisieMessage('')
      setChargementMessages(true)
      const uid = lireIdUtilisateurStockage()
      const messageInitial: MessageTicket[] = [
        {
          id: `init_${t.id}`,
          ticketId: t.id,
          auteur: 'utilisateur',
          contenu: t.message || t.sujet,
          dateEnvoi: t.dateCreation,
        },
      ]
      if (apiRestActive) {
        const rep = await ticketsApiListerMessages(t.id, uid)
        if (rep.ok && rep.messages && rep.messages.length > 0) {
          setMessagesChat(rep.messages)
        } else {
          setMessagesChat(messageInitial)
        }
      } else {
        setMessagesChat(messageInitial)
      }
      setChargementMessages(false)
    },
    [apiRestActive],
  )

  const envoyerMessage = () => {
    const texte = saisieMessage.trim()
    if (!texte || !ticketModal) return
    const uid = lireIdUtilisateurStockage()
    if (!uid) {
      setErreurListe('Session incomplète : identifiant utilisateur manquant pour envoyer un message.')
      return
    }
    const msg: MessageTicket = {
      id: `local_${Date.now()}`,
      ticketId: ticketModal.id,
      auteur: 'utilisateur',
      contenu: texte,
      dateEnvoi: new Date(),
    }
    setMessagesChat((p) => [...p, msg])
    setSaisieMessage('')
    const urlWs = urlWebSocketTicketUtilisateur(ticketModal.id)
    const corps = serialiserMessageWebSocketTicket(uid, texte, {
      ticketId: ticketModal.id,
      typeMessage: 'user_message',
    })
    if (!urlWs) {
      if (apiRestActive) {
        void ticketsApiEnvoyerMessage(ticketModal.id, texte).then((rep) => {
          if (!rep.ok) setErreurListe(rep.erreur ?? 'Envoi du message impossible.')
        })
      } else {
        setErreurListe("Envoi par HTTP impossible : API tickets non configurée.")
      }
      return
    }
    if (envoyerSurWebSocketTicket(refWs.current, corps)) return
    window.setTimeout(() => {
      if (envoyerSurWebSocketTicket(refWs.current, corps)) return
      if (apiRestActive) {
        void ticketsApiEnvoyerMessage(ticketModal.id, texte).then((rep) => {
          if (!rep.ok) setErreurListe(rep.erreur ?? 'Envoi du message impossible.')
        })
      }
    }, 1500)
  }

  const soumettreNouvelleDemande = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreurFormulaire(null)
    const t = titre.trim()
    const d = description.trim()
    if (!t || !d) {
      setErreurFormulaire('Le titre et la description sont obligatoires.')
      return
    }
    setEnvoiEnCours(true)
    try {
      if (!apiRestActive) {
        setErreurFormulaire(
          "L'API tickets n'est pas configurée (URL d'API et préfixe service utilisateur).",
        )
        return
      }
      const rep = await ticketsApiCreer(t, d)
      if (!rep.ok) {
        setErreurFormulaire(rep.erreur ?? 'Creation impossible')
        return
      }
      setTitre('')
      setDescription('')
      setModaleCreationOuverte(false)
      await chargerConversationsApi()
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const marquerResolu = async () => {
    if (!ticketModal) return
    setFermetureEnCours(true)
    try {
      if (!apiRestActive) {
        setErreurListe("Clôture impossible : API tickets non configurée.")
        return
      }
      const rep = await ticketsApiFermer(ticketModal.id)
      if (!rep.ok) {
        setErreurListe(rep.erreur ?? 'Cloture impossible')
        return
      }
      setTicketModal(null)
      setMessagesChat([])
      await chargerConversationsApi()
    } finally {
      setFermetureEnCours(false)
    }
  }

  const gererRecherche = useCallback((terme: string) => {
    setRecherche(terme)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((p) => ({ ...p, page: nouvellePage }))
  }

  const gererRetry = () => {
    setLoadingRetry(true)
    if (apiRestActive) void chargerConversationsApi()
    else {
      setErreurListe(
        "L'API tickets n'est pas configurée (URL d'API et préfixe service utilisateur).",
      )
      setLoadingRetry(false)
    }
  }

  const colonnes: ColonneTable<TicketSupportUser>[] = useMemo(
    () => [
      {
        id: 'sujet',
        label: 'Titre',
        accesseur: (t) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{t.sujet}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{t.message}</p>
          </div>
        ),
      },
      {
        id: 'email',
        label: 'Email',
        largeur: '200px',
        accesseur: () => (
          <span className="block truncate text-sm text-muted-foreground" title={emailProfil ?? undefined}>
            {emailProfil ?? '—'}
          </span>
        ),
      },
      {
        id: 'statut',
        label: 'Statut',
        largeur: '120px',
        accesseur: (t) => {
          const cfg = configStatutTicket(t.statut)
          return (
            <Badge className={cn('border-0 text-[10px]', cfg.classe)} variant="secondary">
              {cfg.label}
            </Badge>
          )
        },
      },
      {
        id: 'dateCreation',
        label: 'Date de création',
        largeur: '180px',
        accesseur: (t) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formaterDateHeure(t.dateCreation)}
          </span>
        ),
      },
      {
        id: 'voir',
        label: '',
        largeur: '110px',
        accesseur: (t) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              void ouvrirConversation(t)
            }}
          >
            <Eye className="h-4 w-4 shrink-0" />
            Voir
          </Button>
        ),
      },
    ],
    [ouvrirConversation, emailProfil],
  )

  const paginationPourTable: ConfigPagination | undefined =
    apiRestActive && ticketsFiltres.length > 0
      ? { page: pagination.page, parPage: pagination.parPage, total: ticketsFiltres.length }
      : !apiRestActive && pagination.total > 0
        ? pagination
        : undefined

  if (estChargement && ticketsComplets.length === 0 && !erreurListe) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  return (
    <div className="space-y-3 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Assistance</h2>
          <p className="text-xs text-slate-500 sm:text-sm">Suivez vos echanges avec le support</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setErreurFormulaire(null)
            setModaleCreationOuverte(true)
          }}
          className="shrink-0 gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ouvrir un ticket
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {erreurListe && (
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{erreurListe}</span>
              <Button type="button" variant="outline" size="sm" onClick={gererRetry} disabled={loadingRetry}>
                {loadingRetry ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Reessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <TableDonnees
              colonnes={colonnes}
              donnees={ticketsPage.lignes}
              estChargement={estChargement}
              pagination={paginationPourTable}
              onChangementPage={gererChangementPage}
              optionsParPage={OPTIONS_ELEMENTS_PAR_PAGE_TICKETS}
              onChangementParPage={(parPage) =>
                setPagination((p) => ({ ...p, parPage, page: 1 }))
              }
              selectParPageAuDessusDuTableau
              aCoteSelectParPage={
                <ChampRecherche
                  placeholder="Titre, message, id, email..."
                  valeur={recherche}
                  onChange={gererRecherche}
                  className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
                />
              }
              idAccesseur={(t) => t.id}
              lignesParPageSkeleton={pagination.parPage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={modaleCreationOuverte}
        onOpenChange={(ouvert) => {
          setModaleCreationOuverte(ouvert)
          if (!ouvert) {
            setErreurFormulaire(null)
            setTitre('')
            setDescription('')
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
            <DialogDescription>
              Indiquez un titre et une description. Un conseiller pourra vous repondre dans la conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={soumettreNouvelleDemande} className="space-y-4">
            {erreurFormulaire && (
              <Alert variant="destructive">
                <AlertDescription>{erreurFormulaire}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="titre-ticket">Titre</Label>
              <Input
                id="titre-ticket"
                placeholder="Resume bref de votre demande"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="border-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description-ticket">Description</Label>
              <Textarea
                id="description-ticket"
                placeholder="Decrivez votre situation, les etapes de reproduction, etc."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none border-slate-200"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModaleCreationOuverte(false)}
                disabled={envoiEnCours}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={envoiEnCours} className="gap-2">
                {envoiEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer la demande
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ticketModal != null}
        onOpenChange={(ouvert) => {
          if (!ouvert) {
            setTicketModal(null)
            setMessagesChat([])
            fermerWebSocket()
          }
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col gap-0 p-0 sm:max-w-lg">
          {ticketModal && (
            <>
              <DialogHeader className="border-b border-border/40 p-4 text-left">
                <DialogTitle className="pr-8 text-base leading-snug">{ticketModal.sujet}</DialogTitle>
                <DialogDescription className="line-clamp-2 text-left text-xs">
                  {ticketModal.message}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="min-h-[280px] flex-1 px-4 py-3">
                {chargementMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messagesChat.map((m) => (
                      <div
                        key={m.id}
                        className={cn('flex', m.auteur === 'utilisateur' ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                            m.auteur === 'utilisateur'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground',
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.contenu}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px] opacity-80',
                              m.auteur === 'utilisateur' ? 'text-primary-foreground/80' : 'text-muted-foreground',
                            )}
                          >
                            {formaterDateHeure(m.dateEnvoi)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={refScrollFin} />
                  </div>
                )}
              </ScrollArea>
              <div className="border-t border-border/40 p-3">
                {ticketPeutEtreCloture(ticketModal) && (
                  <div className="mb-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void marquerResolu()}
                      disabled={fermetureEnCours}
                    >
                      {fermetureEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Marquer comme resolu
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Votre message..."
                    value={saisieMessage}
                    onChange={(e) => setSaisieMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        envoyerMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={envoyerMessage} disabled={!saisieMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
