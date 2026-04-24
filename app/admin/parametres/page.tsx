'use client'

import { useState } from 'react'
import { enregistrer2faRequisAdmin, lire2faRequisAdmin } from '@/lib/mfa-preference'
import { Shield, Bell, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

export default function PageParametres() {
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  
  // États des paramètres
  const [mfaActif, setMfaActif] = useState(() => lire2faRequisAdmin())
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifConnexion, setNotifConnexion] = useState(true)
  const [notifTransaction, setNotifTransaction] = useState(true)
  const [notifQuota, setNotifQuota] = useState(true)

  const enregistrer = async () => {
    setEstEnregistrement(true)
    enregistrer2faRequisAdmin(mfaActif)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEstEnregistrement(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Paramètres de sécurité</h2>
          <p className="text-sm text-muted-foreground">
            Configurez la sécurité et les notifications de la plateforme
          </p>
        </div>
        <Button onClick={enregistrer} disabled={estEnregistrement}>
          {estEnregistrement ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Authentification */}
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Authentification à deux facteurs (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Exiger le 2FA pour tous les administrateurs
                </p>
              </div>
              <Switch checked={mfaActif} onCheckedChange={setMfaActif} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
              </div>
              <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nouvelles connexions</Label>
                <p className="text-sm text-muted-foreground">
                  Alerter lors de connexions inhabituelles
                </p>
              </div>
              <Switch checked={notifConnexion} onCheckedChange={setNotifConnexion} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Transactions</Label>
                <p className="text-sm text-muted-foreground">Alerter sur les paiements échoués</p>
              </div>
              <Switch checked={notifTransaction} onCheckedChange={setNotifTransaction} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes quota</Label>
                <p className="text-sm text-muted-foreground">
                  Notifier quand un utilisateur dépasse 90%
                </p>
              </div>
              <Switch checked={notifQuota} onCheckedChange={setNotifQuota} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
