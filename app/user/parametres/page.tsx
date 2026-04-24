'use client'

import { useState } from 'react'
import { Shield, Bell, Save, UserX, Info } from 'lucide-react'
import { enregistrer2faRequisUtilisateur, lire2faRequisUtilisateur } from '@/lib/mfa-preference'
import {
  demanderSuppressionCompte,
  LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE,
} from '@/lib/api/user-service'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

export default function PageParametres() {
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [estEnvoiDemandeSuppression, setEstEnvoiDemandeSuppression] = useState(false)
  const [messageSuccesSuppression, setMessageSuccesSuppression] = useState<string | null>(null)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const [motifSuppression, setMotifSuppression] = useState('')
  const [erreurMotifSuppression, setErreurMotifSuppression] = useState<string | null>(null)

  const [mfaActif, setMfaActif] = useState(() => lire2faRequisUtilisateur())
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifConnexion, setNotifConnexion] = useState(true)
  const [notifTransaction, setNotifTransaction] = useState(true)
  const [notifQuota, setNotifQuota] = useState(true)

  const enregistrer = async () => {
    setEstEnregistrement(true)
    enregistrer2faRequisUtilisateur(mfaActif)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEstEnregistrement(false)
  }

  const ouvrirDemandeSuppression = () => {
    setErreurSuppression(null)
    setErreurMotifSuppression(null)
    setModaleSuppressionOuverte(true)
  }

  const fermerModaleSuppression = () => {
    if (estEnvoiDemandeSuppression) return
    setModaleSuppressionOuverte(false)
    setErreurMotifSuppression(null)
  }

  const confirmerDemandeSuppression = async () => {
    setErreurMotifSuppression(null)
    const motifTrim = motifSuppression.trim()
    if (motifTrim.length < LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE) {
      setErreurMotifSuppression(
        `Indiquez un motif d'au moins ${LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE} caractères (sans compter les espaces en début ou fin).`,
      )
      return
    }

    setEstEnvoiDemandeSuppression(true)
    setErreurSuppression(null)
    const reponse = await demanderSuppressionCompte(motifSuppression)
    setEstEnvoiDemandeSuppression(false)

    if (reponse.succes && reponse.donnees) {
      setModaleSuppressionOuverte(false)
      setMotifSuppression('')
      setErreurMotifSuppression(null)
      const dateStr = reponse.donnees.dateEnregistrement.toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
      setMessageSuccesSuppression(
        `Votre demande a été enregistrée (référence ${reponse.donnees.idDemande}, le ${dateStr}). ` +
          `Vous recevrez un email de confirmation. Votre compte reste accessible jusqu'au traitement définitif par notre équipe.`,
      )
      return
    }

    setModaleSuppressionOuverte(false)
    setErreurMotifSuppression(null)
    setErreurSuppression(reponse.erreur ?? `Impossible d'enregistrer la demande. Réessayez plus tard.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Paramètres de sécurité</h2>
          <p className="text-sm text-muted-foreground">
            Configurez la sécurité et les notifications de votre compte
          </p>
        </div>
        <Button onClick={enregistrer} disabled={estEnregistrement} className="w-full shrink-0 sm:w-auto">
          {estEnregistrement ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Authentification</CardTitle>
                <CardDescription>Sécurité des connexions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Authentification à deux facteurs (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Exiger le 2FA lors de vos prochaines connexions sur ce navigateur
                </p>
              </div>
              <Switch checked={mfaActif} onCheckedChange={setMfaActif} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Alertes et communications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
              </div>
              <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Nouvelles connexions</Label>
                <p className="text-sm text-muted-foreground">Alerter lors de connexions inhabituelles</p>
              </div>
              <Switch checked={notifConnexion} onCheckedChange={setNotifConnexion} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Transactions</Label>
                <p className="text-sm text-muted-foreground">Alerter sur les paiements échoués</p>
              </div>
              <Switch checked={notifTransaction} onCheckedChange={setNotifTransaction} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Alertes quota</Label>
                <p className="text-sm text-muted-foreground">
                  Notifier lorsque votre utilisation dépasse 90 % de votre quota
                </p>
              </div>
              <Switch checked={notifQuota} onCheckedChange={setNotifQuota} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base text-destructive">Suppression du compte</CardTitle>
              <CardDescription>
                Demandez la suppression définitive de votre compte et de vos données personnelles, conformément au
                RGPD.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {messageSuccesSuppression && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Demande prise en compte</AlertTitle>
              <AlertDescription>{messageSuccesSuppression}</AlertDescription>
            </Alert>
          )}
          {erreurSuppression && (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{erreurSuppression}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            Cette action déclenche une procédure côté équipe support : vous serez contacté si une vérification est
            nécessaire. Vous pouvez vous déconnecter à tout moment en attendant la clôture du dossier.
          </p>
          <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={ouvrirDemandeSuppression}>
            Demander la suppression de mon compte
          </Button>
        </CardContent>
      </Card>

      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={fermerModaleSuppression}
        onConfirmer={confirmerDemandeSuppression}
        titre="Confirmer la demande de suppression"
        description={
          `Vous allez soumettre une demande de suppression de compte. Ce n'est pas une suppression immédiate : ` +
          `nous traiterons votre demande dans les délais prévus par la réglementation. Souhaitez-vous continuer ?`
        }
        texteConfirmation="Envoyer la demande"
        variante="destructive"
        estChargement={estEnvoiDemandeSuppression}
      >
        <div className="grid gap-2">
          <Label htmlFor="motif-suppression-compte">Motif de la demande</Label>
          <Textarea
            id="motif-suppression-compte"
            className="min-h-[120px] resize-y"
            placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte (obligatoire)."
            value={motifSuppression}
            onChange={(e) => setMotifSuppression(e.target.value)}
            disabled={estEnvoiDemandeSuppression}
            aria-invalid={erreurMotifSuppression ? true : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Minimum {LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE} caractères. Ce texte est transmis à l&apos;équipe pour
            traiter votre demande.
          </p>
          {erreurMotifSuppression && (
            <p className="text-sm text-destructive" role="alert">
              {erreurMotifSuppression}
            </p>
          )}
        </div>
      </ModaleConfirmation>
    </div>
  )
}
