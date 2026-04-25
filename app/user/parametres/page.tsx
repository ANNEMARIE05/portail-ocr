'use client'

import { useCallback, useEffect, useState } from 'react'
import { Shield, Bell, UserX, Info, Mail, MessageSquare, Smartphone } from 'lucide-react'
import {
  enregistrer2faRequisUtilisateur,
  lire2faRequisUtilisateur,
  enregistrerPreferencesNotificationsUtilisateur,
  lirePreferencesNotificationsUtilisateur,
  PREFERENCES_NOTIFICATIONS_DEFAUT,
} from '@/lib/mfa-preference'
import {
  demanderSuppressionCompte,
  LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE,
} from '@/lib/api/user-service'
import {
  mettreAJourMfaEnabledLegacy,
  mettreAJourPreferencesSecuriteConnecte,
  rafraichirProfilConnecteDepuisMe,
  type CanalMfaApi,
} from '@/lib/api/auth-api'
import {
  lireCanalMfaSession,
  lireDonneesProfilUtilisateurSession,
} from '@/lib/api/session-client'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { estBackendUtilisateurConfigure } from '@/lib/api/env-backend'

export default function PageParametres() {
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [estEnvoiDemandeSuppression, setEstEnvoiDemandeSuppression] = useState(false)
  const [messageSuccesSuppression, setMessageSuccesSuppression] = useState<string | null>(null)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const [motifSuppression, setMotifSuppression] = useState('')
  const [erreurMotifSuppression, setErreurMotifSuppression] = useState<string | null>(null)
  const [erreurPreferences, setErreurPreferences] = useState<string | null>(null)
  const [messageSuccesPreferences, setMessageSuccesPreferences] = useState<string | null>(null)
  const [cleSauvegarde, setCleSauvegarde] = useState<string | null>(null)
  const [modaleCanal2FA, setModaleCanal2FA] = useState(false)
  const [canal2FA, setCanal2FA] = useState<CanalMfaApi | null>(null)

  // État initial identique SSR / premier rendu client (pas de lecture localStorage ici — évite mismatch d’hydratation).
  const [mfaActif, setMfaActif] = useState(false)
  const [notifEmail, setNotifEmail] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.email)
  const [notifPush, setNotifPush] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.push)
  const [notifConnexion, setNotifConnexion] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.connexion)
  const [notifTransaction, setNotifTransaction] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.transaction)
  const [notifQuota, setNotifQuota] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.quota)

  useEffect(() => {
    let annule = false
    const sync = async () => {
      if (estBackendUtilisateurConfigure()) {
        await rafraichirProfilConnecteDepuisMe('user')
      }
      if (annule) return
      const dep = lireDonneesProfilUtilisateurSession().twoFactorDepuisApi
      setMfaActif(dep !== null ? dep : lire2faRequisUtilisateur())
      setCanal2FA(lireCanalMfaSession('user'))
      const n = lirePreferencesNotificationsUtilisateur()
      setNotifEmail(n.email)
      setNotifPush(n.push)
      setNotifConnexion(n.connexion)
      setNotifTransaction(n.transaction)
      setNotifQuota(n.quota)
    }
    void sync()
    return () => {
      annule = true
    }
  }, [])

  const appliquerFallbackLocal = useCallback(
    (patch: {
      mfa?: boolean
      email?: boolean
      push?: boolean
      connexion?: boolean
      transaction?: boolean
      quota?: boolean
    }) => {
      if (patch.mfa !== undefined) enregistrer2faRequisUtilisateur(patch.mfa)
      if (
        patch.email !== undefined ||
        patch.push !== undefined ||
        patch.connexion !== undefined ||
        patch.transaction !== undefined ||
        patch.quota !== undefined
      ) {
        enregistrerPreferencesNotificationsUtilisateur({
          ...(patch.email !== undefined ? { email: patch.email } : {}),
          ...(patch.push !== undefined ? { push: patch.push } : {}),
          ...(patch.connexion !== undefined ? { connexion: patch.connexion } : {}),
          ...(patch.transaction !== undefined ? { transaction: patch.transaction } : {}),
          ...(patch.quota !== undefined ? { quota: patch.quota } : {}),
        })
      }
    },
    [],
  )

  const afficherSuccesPreferences = (msg: string) => {
    setMessageSuccesPreferences(msg)
    window.setTimeout(() => setMessageSuccesPreferences(null), 5000)
  }

  const onMfaChange = async (checked: boolean) => {
    setErreurPreferences(null)
    setMessageSuccesPreferences(null)
    if (checked) {
      setModaleCanal2FA(true)
      return
    }
    const prev = mfaActif
    setMfaActif(false)
    setCleSauvegarde('mfa')
    const res = await mettreAJourMfaEnabledLegacy({ service: 'user', mfaEnabled: false })
    setCleSauvegarde(null)
    if (!res.ok) {
      setMfaActif(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (res.viaApi) {
      const dep = lireDonneesProfilUtilisateurSession().twoFactorDepuisApi
      setMfaActif(dep !== null ? dep : false)
      setCanal2FA(lireCanalMfaSession('user'))
      afficherSuccesPreferences('Authentification à deux facteurs désactivée.')
      return
    }
    appliquerFallbackLocal({ mfa: false })
    setCanal2FA(null)
  }

  const activer2FAavecCanal = async (canal: CanalMfaApi) => {
    setErreurPreferences(null)
    setMessageSuccesPreferences(null)
    setCleSauvegarde('mfa')
    const res = await mettreAJourMfaEnabledLegacy({
      service: 'user',
      mfaEnabled: true,
      channel: canal,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    setModaleCanal2FA(false)
    if (res.viaApi) {
      const dep = lireDonneesProfilUtilisateurSession().twoFactorDepuisApi
      setMfaActif(dep !== null ? dep : true)
      setCanal2FA(lireCanalMfaSession('user'))
      const libelleCanal =
        canal === 'email' ? 'e-mail' : canal === 'sms' ? 'SMS' : 'notification push'
      afficherSuccesPreferences(`2FA activée (${libelleCanal}).`)
      return
    }
    appliquerFallbackLocal({ mfa: true })
    setCanal2FA(canal)
    afficherSuccesPreferences('2FA activée (préférence locale).')
  }

  const onNotifPushChange = async (checked: boolean) => {
    const prev = notifPush
    setNotifPush(checked)
    setCleSauvegarde('notif-push')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'user',
      pushNotifications: checked,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setNotifPush(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (!res.viaApi) appliquerFallbackLocal({ push: checked })
  }

  const onNotifEmailChange = async (checked: boolean) => {
    const prev = notifEmail
    setNotifEmail(checked)
    setCleSauvegarde('notif-email')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'user',
      emailNotifications: checked,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setNotifEmail(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (!res.viaApi) appliquerFallbackLocal({ email: checked })
  }

  const onNotifConnexionChange = async (checked: boolean) => {
    const prev = notifConnexion
    setNotifConnexion(checked)
    setCleSauvegarde('notif-connexion')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'user',
      loginNotifications: checked,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setNotifConnexion(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (!res.viaApi) appliquerFallbackLocal({ connexion: checked })
  }

  const onNotifTransactionChange = async (checked: boolean) => {
    const prev = notifTransaction
    setNotifTransaction(checked)
    setCleSauvegarde('notif-transaction')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'user',
      transactionNotifications: checked,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setNotifTransaction(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (!res.viaApi) appliquerFallbackLocal({ transaction: checked })
  }

  const onNotifQuotaChange = async (checked: boolean) => {
    const prev = notifQuota
    setNotifQuota(checked)
    setCleSauvegarde('notif-quota')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'user',
      quotaNotifications: checked,
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setNotifQuota(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (!res.viaApi) appliquerFallbackLocal({ quota: checked })
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
    <div className="space-y-3 sm:space-y-5 md:space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground sm:text-lg">Paramètres de sécurité</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Configurez la sécurité et les notifications de votre compte — les changements sont enregistrés
          automatiquement.
        </p>
      </div>

      {erreurPreferences && (
        <Alert variant="destructive">
          <AlertTitle>Préférences</AlertTitle>
          <AlertDescription>{erreurPreferences}</AlertDescription>
        </Alert>
      )}

      {messageSuccesPreferences && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Enregistré</AlertTitle>
          <AlertDescription>{messageSuccesPreferences}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:gap-5 md:gap-6 lg:grid-cols-2">
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
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Authentification à deux facteurs (2FA)</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {mfaActif && canal2FA
                    ? `Activée — codes envoyés par ${
                        canal2FA === 'email' ? 'e-mail' : canal2FA === 'sms' ? 'SMS' : 'notification push'
                      }`
                    : mfaActif
                      ? 'Activée sur votre compte'
                      : 'Recevez un code à chaque connexion (e-mail, SMS ou push selon le canal choisi)'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'mfa' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={mfaActif} onCheckedChange={(v) => void onMfaChange(v)} />
              </div>
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
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">Recevoir les alertes par email</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-email' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifEmail} onCheckedChange={(v) => void onNotifEmailChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Notifications push</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Alertes instantanées sur vos appareils (si pris en charge par l&apos;API)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-push' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifPush} onCheckedChange={(v) => void onNotifPushChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Nouvelles connexions</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">Alerter lors de connexions inhabituelles</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-connexion' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifConnexion} onCheckedChange={(v) => void onNotifConnexionChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Transactions</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">Alerter sur les paiements échoués</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-transaction' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifTransaction} onCheckedChange={(v) => void onNotifTransactionChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label>Alertes quota</Label>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Notifier lorsque votre utilisation dépasse 90 % de votre quota
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-quota' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifQuota} onCheckedChange={(v) => void onNotifQuotaChange(v)} />
              </div>
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
        <CardContent className="space-y-3 sm:space-y-4">
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
          <p className="text-xs text-muted-foreground sm:text-sm">
            Cette action déclenche une procédure côté équipe support : vous serez contacté si une vérification est
            nécessaire. Vous pouvez vous déconnecter à tout moment en attendant la clôture du dossier.
          </p>
          <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={ouvrirDemandeSuppression}>
            Demander la suppression de mon compte
          </Button>
        </CardContent>
      </Card>

      <Dialog open={modaleCanal2FA} onOpenChange={setModaleCanal2FA}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Canal pour le 2FA</DialogTitle>
            <DialogDescription>
              Choisissez comment recevoir les codes de vérification à la connexion (même API que l&apos;ancien
              portail).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
              onClick={() => void activer2FAavecCanal('email')}
              disabled={cleSauvegarde === 'mfa'}
            >
              <Mail className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <div className="text-sm font-medium">E-mail</div>
                <div className="text-xs text-muted-foreground">Codes envoyés par e-mail</div>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
              onClick={() => void activer2FAavecCanal('sms')}
              disabled={cleSauvegarde === 'mfa'}
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <div className="text-sm font-medium">SMS</div>
                <div className="text-xs text-muted-foreground">Codes envoyés par SMS</div>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
              onClick={() => void activer2FAavecCanal('push')}
              disabled={cleSauvegarde === 'mfa'}
            >
              <Smartphone className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Push</div>
                <div className="text-xs text-muted-foreground">Notifications sur l&apos;appareil</div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
