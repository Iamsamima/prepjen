import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings2, Globe, Bell, Palette, Save } from 'lucide-react';
import { toast } from 'sonner';

interface GeneralConfig {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  appointmentDuration: string;
  enableNotifications: boolean;
  enableAutoSave: boolean;
  enableDarkMode: boolean;
  defaultPrescriptionFormat: string;
}

const STORAGE_KEY = 'app_general_settings';

export function GeneralSettings() {
  const [config, setConfig] = useState<GeneralConfig>({
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    appointmentDuration: '15',
    enableNotifications: true,
    enableAutoSave: true,
    enableDarkMode: false,
    defaultPrescriptionFormat: 'A4',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setConfig(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast.success('General settings saved!');
  };

  const update = (key: keyof GeneralConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold font-display">General Settings</h2>
      </div>

      {/* Localization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Localization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={config.language} onValueChange={v => update('language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="bn">Bengali</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={config.timezone} onValueChange={v => update('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">EST (New York)</SelectItem>
                  <SelectItem value="Europe/London">GMT (London)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={config.dateFormat} onValueChange={v => update('dateFormat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={config.currency} onValueChange={v => update('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Appointments & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Appointment Duration (minutes)</Label>
            <Input
              type="number"
              value={config.appointmentDuration}
              onChange={e => update('appointmentDuration', e.target.value)}
              min="5"
              max="120"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
            </div>
            <Switch checked={config.enableNotifications} onCheckedChange={v => update('enableNotifications', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Save Prescriptions</Label>
              <p className="text-sm text-muted-foreground">Automatically save drafts while editing</p>
            </div>
            <Switch checked={config.enableAutoSave} onCheckedChange={v => update('enableAutoSave', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Appearance & Prescription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Use dark theme across the application</p>
            </div>
            <Switch checked={config.enableDarkMode} onCheckedChange={v => update('enableDarkMode', v)} />
          </div>
          <div className="space-y-2">
            <Label>Default Prescription Paper Size</Label>
            <Select value={config.defaultPrescriptionFormat} onValueChange={v => update('defaultPrescriptionFormat', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-primary shadow-glow gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
