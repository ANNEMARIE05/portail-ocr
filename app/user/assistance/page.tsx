'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, Send, Paperclip } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererTicketsUser } from '@/lib/api/user-service'
import type { TicketSupportUser } from '@/lib/types-user'
import { formaterDateRelative } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageAssistance() {
  const [estChargement, setEstChargement] = useState(true)
  const [tickets, setTickets] = useState<TicketSupportUser[]>([])
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const [nouveauTicket, setNouveauTicket] = useState({
    sujet: '',
    message: '',
    priorite: 'normale' as const,
  })

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererTicketsUser()
      
      if (reponse.succes && reponse.donnees) {
        setTickets(reponse.donnees)
      }
      
      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  const getStatutConfig = (statut: TicketSupportUser['statut']) => {
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

  const getPrioriteConfig = (priorite: TicketSupportUser['priorite']) => {
    switch (priorite) {
      case 'basse':
        return { label: 'Basse', classe: 'bg-slate-100 text-slate-600' }
      case 'normale':
        return { label: 'Normale', classe: 'bg-blue-50 text-blue-600' }
      case 'haute':
        return { label: 'Haute', classe: 'bg-red-50 text-red-600' }
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Assistance</h2>
          <p className="text-sm text-slate-500">Contactez notre equipe de support</p>
        </div>
        <Button 
          onClick={() => setAfficherFormulaire(!afficherFormulaire)}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Plus className="h-4 w-4" />
          Nouveau ticket
        </Button>
      </div>

      {/* Formulaire nouveau ticket */}
      {afficherFormulaire && (
        <Card className="border-slate-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Creer un ticket</CardTitle>
            <CardDescription>Decrivez votre probleme et notre equipe vous repondra rapidement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sujet">Sujet</Label>
                <Input
                  id="sujet"
                  placeholder="Decrivez brievement votre probleme"
                  value={nouveauTicket.sujet}
                  onChange={(e) => setNouveauTicket({ ...nouveauTicket, sujet: e.target.value })}
                  className="border-slate-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priorite">Priorite</Label>
                <Select 
                  value={nouveauTicket.priorite} 
                  onValueChange={(value: 'basse' | 'normale' | 'haute') => setNouveauTicket({ ...nouveauTicket, priorite: value })}
                >
                  <SelectTrigger id="priorite" className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Decrivez votre probleme en detail..."
                rows={5}
                value={nouveauTicket.message}
                onChange={(e) => setNouveauTicket({ ...nouveauTicket, message: e.target.value })}
                className="border-slate-200 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" className="gap-2 text-slate-500">
                <Paperclip className="h-4 w-4" />
                Joindre un fichier
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setAfficherFormulaire(false)} className="border-slate-200">
                  Annuler
                </Button>
                <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                  <Send className="h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des tickets */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Mes tickets</CardTitle>
          <CardDescription>{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tickets.map((ticket, index) => {
              const statutConfig = getStatutConfig(ticket.statut)
              const prioriteConfig = getPrioriteConfig(ticket.priorite)
              
              return (
                <div
                  key={ticket.id}
                  className="group flex items-start gap-4 rounded-lg border border-slate-200/60 p-4 transition-all hover:bg-slate-50/50 hover:border-slate-300/60 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Icone */}
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    ticket.statut === 'resolu' ? "bg-emerald-50" : "bg-slate-100"
                  )}>
                    {ticket.statut === 'resolu' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : ticket.statut === 'en-cours' ? (
                      <Clock className="h-5 w-5 text-amber-600" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  
                  {/* Infos ticket */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{ticket.sujet}</p>
                      <Badge className={cn("text-[10px] border-0 shrink-0", statutConfig.classe)}>
                        {statutConfig.label}
                      </Badge>
                      <Badge className={cn("text-[10px] border-0 shrink-0", prioriteConfig.classe)}>
                        {prioriteConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-2">{ticket.message}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Cree {formaterDateRelative(ticket.dateCreation)}</span>
                      <span>{ticket.nombreReponses} reponse{ticket.nombreReponses > 1 ? 's' : ''}</span>
                      {ticket.derniereReponse && (
                        <span>Derniere reponse {formaterDateRelative(ticket.derniereReponse)}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action */}
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Voir
                  </Button>
                </div>
              )
            })}
          </div>
          
          {tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Aucun ticket</p>
              <p className="text-xs text-slate-400 mt-1">Creez un ticket si vous avez besoin d&apos;aide</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ rapide */}
      <Card className="border-slate-200/60 bg-slate-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Questions frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200/60 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <p className="text-sm font-medium text-slate-900 mb-1">Comment fonctionne le systeme de credits ?</p>
              <p className="text-xs text-slate-500">Chaque document traite consomme un certain nombre de credits...</p>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <p className="text-sm font-medium text-slate-900 mb-1">Quels formats sont supportes ?</p>
              <p className="text-xs text-slate-500">Nous supportons PDF, JPG, PNG, TIFF et Word...</p>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <p className="text-sm font-medium text-slate-900 mb-1">Comment integrer l&apos;API ?</p>
              <p className="text-xs text-slate-500">Consultez notre documentation API complete...</p>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <p className="text-sm font-medium text-slate-900 mb-1">Puis-je obtenir un remboursement ?</p>
              <p className="text-xs text-slate-500">Les credits non utilises peuvent etre rembourses...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
