'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  enregistrer2faRequisAdmin,
  lire2faRequisAdmin,
  enregistrerPreferencesNotificationsAdmin,
  lirePreferencesNotificationsAdmin,
  PREFERENCES_NOTIFICATIONS_DEFAUT,
} from '@/lib/mfa-preference'
import {
  mettreAJourMfaEnabledLegacy,
  mettreAJourPreferencesSecuriteConnecte,
  rafraichirProfilConnecteDepuisMe,
} from '@/lib/api/auth-api'
import { lireDonneesProfilAdminSession } from '@/lib/api/session-client'
import { Shield, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { estBackendAdminConfigure } from '@/lib/api/env-backend'

export default function PageParametres() {
  const [erreurPreferences, setErreurPreferences] = useState<string | null>(null)
  const [cleSauvegarde, setCleSauvegarde] = useState<string | null>(null)

  const [mfaActif, setMfaActif] = useState(false)
  const [notifEmail, setNotifEmail] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.email)
  const [notifPush, setNotifPush] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.push)
  const [notifConnexion, setNotifConnexion] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.connexion)
  const [notifTransaction, setNotifTransaction] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.transaction)
  const [notifQuota, setNotifQuota] = useState(PREFERENCES_NOTIFICATIONS_DEFAUT.quota)

  useEffect(() => {
    let annule = false
    const sync = async () => {
      if (estBackendAdminConfigure()) {
        await rafraichirProfilConnecteDepuisMe('admin')
      }
      if (annule) return
      const dep = lireDonneesProfilAdminSession().twoFactorDepuisApi
      setMfaActif(dep !== null ? dep : lire2faRequisAdmin())
      const n = lirePreferencesNotificationsAdmin()
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
      if (patch.mfa !== undefined) enregistrer2faRequisAdmin(patch.mfa)
      if (
        patch.email !== undefined ||
        patch.push !== undefined ||
        patch.connexion !== undefined ||
        patch.transaction !== undefined ||
        patch.quota !== undefined
      ) {
        enregistrerPreferencesNotificationsAdmin({
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

  const onMfaChange = async (checked: boolean) => {
    const prev = mfaActif
    setMfaActif(checked)
    setCleSauvegarde('mfa')
    setErreurPreferences(null)
    const res = await mettreAJourMfaEnabledLegacy({
      service: 'admin',
      mfaEnabled: checked,
      channel: 'email',
    })
    setCleSauvegarde(null)
    if (!res.ok) {
      setMfaActif(prev)
      setErreurPreferences(res.erreur ?? 'Enregistrement impossible.')
      return
    }
    if (res.viaApi) {
      const dep = lireDonneesProfilAdminSession().twoFactorDepuisApi
      setMfaActif(dep !== null ? dep : checked)
      return
    }
    appliquerFallbackLocal({ mfa: checked })
  }

  const onNotifPushChange = async (checked: boolean) => {
    const prev = notifPush
    setNotifPush(checked)
    setCleSauvegarde('notif-push')
    setErreurPreferences(null)
    const res = await mettreAJourPreferencesSecuriteConnecte({
      service: 'admin',
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
      service: 'admin',
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
      service: 'admin',
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
      service: 'admin',
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
      service: 'admin',
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Paramètres de sécurité</h2>
        <p className="text-sm text-muted-foreground">
          Configurez la sécurité et les notifications de la plateforme — les changements sont enregistrés
          automatiquement.
        </p>
      </div>

      {erreurPreferences && (
        <Alert variant="destructive">
          <AlertTitle>Préférences</AlertTitle>
          <AlertDescription>{erreurPreferences}</AlertDescription>
        </Alert>
      )}

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
                <p className="text-sm text-muted-foreground">Exiger le 2FA pour tous les administrateurs</p>
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
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-email' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifEmail} onCheckedChange={(v) => void onNotifEmailChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">Alertes instantanées (si pris en charge par l&apos;API)</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-push' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifPush} onCheckedChange={(v) => void onNotifPushChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Nouvelles connexions</Label>
                <p className="text-sm text-muted-foreground">Alerter lors de connexions inhabituelles</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-connexion' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifConnexion} onCheckedChange={(v) => void onNotifConnexionChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Transactions</Label>
                <p className="text-sm text-muted-foreground">Alerter sur les paiements échoués</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-transaction' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifTransaction} onCheckedChange={(v) => void onNotifTransactionChange(v)} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Alertes quota</Label>
                <p className="text-sm text-muted-foreground">Notifier quand un utilisateur dépasse 90%</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cleSauvegarde === 'notif-quota' ? <Spinner className="h-4 w-4" /> : null}
                <Switch checked={notifQuota} onCheckedChange={(v) => void onNotifQuotaChange(v)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
