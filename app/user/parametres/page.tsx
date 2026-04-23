'use client'

import { useState } from 'react'
import { Bell, Mail, Smartphone, Shield, Globe, Check, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PageParametres() {
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [parametres, setParametres] = useState({
    notifEmail: true,
    notifPush: false,
    notifSms: false,
    mfaActif: false,
    langue: 'fr',
    fuseau: 'Europe/Paris',
  })

  const gererEnregistrement = async () => {
    setEstEnregistrement(true)
    await new Promise(r => setTimeout(r, 1000))
    setEstEnregistrement(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Notifications */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-500" />
            Notifications
          </CardTitle>
          <CardDescription>Configurez comment vous souhaitez etre notifie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="notif-email" className="text-sm font-medium">Notifications par email</Label>
                <p className="text-xs text-slate-500">Recevez les alertes et mises a jour par email</p>
              </div>
            </div>
            <Switch
              id="notif-email"
              checked={parametres.notifEmail}
              onCheckedChange={(checked) => setParametres({ ...parametres, notifEmail: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Smartphone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <Label htmlFor="notif-push" className="text-sm font-medium">Notifications push</Label>
                <p className="text-xs text-slate-500">Recevez des notifications dans votre navigateur</p>
              </div>
            </div>
            <Switch
              id="notif-push"
              checked={parametres.notifPush}
              onCheckedChange={(checked) => setParametres({ ...parametres, notifPush: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Smartphone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Label htmlFor="notif-sms" className="text-sm font-medium">Notifications SMS</Label>
                <p className="text-xs text-slate-500">Recevez les alertes critiques par SMS</p>
              </div>
            </div>
            <Switch
              id="notif-sms"
              checked={parametres.notifSms}
              onCheckedChange={(checked) => setParametres({ ...parametres, notifSms: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Securite */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-500" />
            Securite
          </CardTitle>
          <CardDescription>Parametres de securite de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <Label htmlFor="mfa" className="text-sm font-medium">Authentification a deux facteurs (2FA)</Label>
                <p className="text-xs text-slate-500">Ajoutez une couche de securite supplementaire</p>
              </div>
            </div>
            <Switch
              id="mfa"
              checked={parametres.mfaActif}
              onCheckedChange={(checked) => setParametres({ ...parametres, mfaActif: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-500" />
            Preferences
          </CardTitle>
          <CardDescription>Personnalisez votre experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="langue">Langue</Label>
              <Select 
                value={parametres.langue} 
                onValueChange={(value) => setParametres({ ...parametres, langue: value })}
              >
                <SelectTrigger id="langue" className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuseau">Fuseau horaire</Label>
              <Select 
                value={parametres.fuseau} 
                onValueChange={(value) => setParametres({ ...parametres, fuseau: value })}
              >
                <SelectTrigger id="fuseau" className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                  <SelectItem value="Europe/London">Londres (UTC)</SelectItem>
                  <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton enregistrer */}
      <div className="flex justify-end">
        <Button 
          onClick={gererEnregistrement}
          disabled={estEnregistrement}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {estEnregistrement ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
