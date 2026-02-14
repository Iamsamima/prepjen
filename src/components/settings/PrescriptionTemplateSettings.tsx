import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTemplates } from '@/hooks/useTemplates';
import { FileText, Search, Trash2, Pill, Stethoscope, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export function PrescriptionTemplateSettings() {
  const {
    medicineTemplates, deleteMedicineTemplate,
    diagnosisTemplates, deleteDiagnosisTemplate,
    prescriptionTemplates, deletePrescriptionTemplate,
  } = useTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'prescription' | 'medicine' | 'diagnosis'>('prescription');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filterBySearch = <T extends { name: string }>(items: T[]) => {
    if (!debouncedSearch) return items;
    try {
      const regex = new RegExp(debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return items.filter(i => regex.test(i.name));
    } catch { return items; }
  };

  const tabs = [
    { key: 'prescription' as const, label: 'Prescription', icon: ClipboardList, count: prescriptionTemplates.length },
    { key: 'medicine' as const, label: 'Medicine', icon: Pill, count: medicineTemplates.length },
    { key: 'diagnosis' as const, label: 'Diagnosis', icon: Stethoscope, count: diagnosisTemplates.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold font-display">Prescription Templates</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge variant="secondary" className="ml-1 text-xs">{tab.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="pl-9"
        />
      </div>

      {/* Prescription Templates */}
      {activeTab === 'prescription' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Full Prescription Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {filterBySearch(prescriptionTemplates).length > 0 ? (
              <div className="space-y-2">
                {filterBySearch(prescriptionTemplates).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.medicines.length} medicines • {t.diagnoses.length} diagnoses • {t.tests.length} tests
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { deletePrescriptionTemplate(t.id); toast.success('Template deleted'); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No prescription templates saved yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medicine Templates */}
      {activeTab === 'medicine' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Medicine Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {filterBySearch(medicineTemplates).length > 0 ? (
              <div className="space-y-2">
                {filterBySearch(medicineTemplates).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.medicines.length} medicines</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { deleteMedicineTemplate(t.id); toast.success('Template deleted'); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No medicine templates saved yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Templates */}
      {activeTab === 'diagnosis' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Diagnosis Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {filterBySearch(diagnosisTemplates).length > 0 ? (
              <div className="space-y-2">
                {filterBySearch(diagnosisTemplates).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.diagnoses.length} diagnoses • {t.diagnosisType}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { deleteDiagnosisTemplate(t.id); toast.success('Template deleted'); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No diagnosis templates saved yet.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
