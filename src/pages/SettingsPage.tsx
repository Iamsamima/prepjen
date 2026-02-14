import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { RolePermissionSettings } from '@/components/settings/RolePermissionSettings';
import { MedicineSettings } from '@/components/settings/MedicineSettings';
import { PrescriptionTemplateSettings } from '@/components/settings/PrescriptionTemplateSettings';
import { TestsSettings } from '@/components/settings/TestsSettings';
import { Stethoscope, ArrowLeft, LogOut, Settings, User, Settings2, Shield, Pill, FileText, FlaskConical } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold font-display text-lg">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="medicines" className="gap-2 text-xs sm:text-sm">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medicines</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2 text-xs sm:text-sm">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Tests</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileSettings /></TabsContent>
          <TabsContent value="general"><GeneralSettings /></TabsContent>
          <TabsContent value="roles"><RolePermissionSettings /></TabsContent>
          <TabsContent value="medicines"><MedicineSettings /></TabsContent>
          <TabsContent value="templates"><PrescriptionTemplateSettings /></TabsContent>
          <TabsContent value="tests"><TestsSettings /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
