import React, { useEffect, useState, useMemo } from 'react';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrescriptionSuggestions } from '@/hooks/usePrescriptionSuggestions';
import { useSavedMedicines } from '@/hooks/useSavedMedicines';
import { TemplateManager } from '@/components/prescription/TemplateManager';
import { Pill, X, Plus, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { SuggestionMode } from '@/types/suggestion';

interface Medicine {
  name: string;
  type: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  selected: boolean;
}

interface MedicineTemplate {
  id: string;
  name: string;
  medicines: Medicine[];
  createdAt: number;
}

interface MedicinesSectionProps {
  symptoms: string[];
  diagnoses: { name: string }[];
  medicines: Medicine[];
  onMedicinesChange: (medicines: Medicine[]) => void;
  patientInfo?: { age?: string; gender?: string; weight?: string };
  medicineTemplates: MedicineTemplate[];
  onSaveMedicineTemplate: (name: string, medicines: Medicine[]) => void;
  onDeleteMedicineTemplate: (id: string) => void;
  suggestionMode?: SuggestionMode;
}

const emptyMedicine: Medicine = {
  name: '',
  type: 'Tablet',
  dose: '',
  frequency: '',
  route: 'Oral',
  duration: '',
  selected: true,
};

const medicineTypes = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder'];
const routes = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Nasal', 'Rectal'];

export function MedicinesSection({
  symptoms,
  diagnoses,
  medicines,
  onMedicinesChange,
  patientInfo,
  medicineTemplates,
  onSaveMedicineTemplate,
  onDeleteMedicineTemplate,
  suggestionMode = 'combined',
}: MedicinesSectionProps) {
  const [hasFetchedAI, setHasFetchedAI] = useState(false);
  const { loading, suggestions, fetchSuggestions, clearSuggestions } = usePrescriptionSuggestions();
  const { searchMedicines } = useSavedMedicines();
  const [medicineNameInputs, setMedicineNameInputs] = useState<Record<number, string>>({});
  const [activeField, setActiveField] = useState<{ index: number; field: string } | null>(null);
  const [activeNameIndex, setActiveNameIndex] = useState<number | null>(null);

  const useAI = suggestionMode === 'ai' || suggestionMode === 'combined';

  // Auto-fetch medicine suggestions when diagnosis changes
  useEffect(() => {
    if (diagnoses.length > 0 && !hasFetchedAI && medicines.length === 0 && useAI) {
      const diagnosisStr = diagnoses.map(d => d.name).join(', ');
      const symptomsStr = symptoms.join(', ');
      fetchSuggestions('medicines', { diagnosis: diagnosisStr, symptoms: symptomsStr }).then((meds) => {
        if (meds.length > 0) {
          const newMeds = meds.slice(0, 5).map((m: any) => ({
            name: m.name || '',
            type: m.type || 'Tablet',
            dose: '',
            frequency: '',
            route: 'Oral',
            duration: '',
            selected: true,
          }));
          onMedicinesChange(newMeds);
        }
      });
      setHasFetchedAI(true);
    }
  }, [diagnoses, useAI]);

  // Reset when diagnoses clear
  useEffect(() => {
    if (diagnoses.length === 0) {
      setHasFetchedAI(false);
    }
  }, [diagnoses]);

  const handleMedicineChange = (index: number, field: keyof Medicine, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    onMedicinesChange(updated);
  };

  const handleMedicineNameChange = (index: number, value: string) => {
    setMedicineNameInputs(prev => ({ ...prev, [index]: value }));
    handleMedicineChange(index, 'name', value);
    setActiveNameIndex(index);
  };

  const handleMedicineNameSelect = (index: number, item: any) => {
    const name = typeof item === 'string' ? item : item.name || '';
    handleMedicineChange(index, 'name', name);
    setMedicineNameInputs(prev => ({ ...prev, [index]: '' }));
    setActiveNameIndex(null);

    // Auto-fill defaults from saved medicine database
    if (typeof item === 'object' && item.defaultDose) {
      const updated = [...medicines];
      updated[index] = {
        ...updated[index],
        name,
        type: item.type || updated[index].type,
        dose: item.defaultDose || updated[index].dose,
        frequency: item.defaultFrequency || updated[index].frequency,
        route: item.defaultRoute || updated[index].route,
        duration: item.defaultDuration || updated[index].duration,
      };
      onMedicinesChange(updated);
    }
  };

  // Get name suggestions based on mode
  const getNameSuggestions = (index: number) => {
    const query = medicineNameInputs[index] || medicines[index]?.name || '';
    if (!query || query.length < 1 || activeNameIndex !== index) return [];
    
    const useSaved = suggestionMode === 'saved' || suggestionMode === 'combined';
    if (!useSaved) return [];
    
    return searchMedicines(query).map(m => ({
      name: m.name,
      description: [m.type, m.defaultDose, m.defaultFrequency].filter(Boolean).join(' • '),
      type: m.type,
      defaultDose: m.defaultDose,
      defaultFrequency: m.defaultFrequency,
      defaultRoute: m.defaultRoute,
      defaultDuration: m.defaultDuration,
    }));
  };

  const handleAddMedicine = () => {
    onMedicinesChange([...medicines, { ...emptyMedicine }]);
  };

  const handleRemoveMedicine = (index: number) => {
    onMedicinesChange(medicines.filter((_, i) => i !== index));
  };

  const fetchFieldSuggestions = async (index: number, field: 'dose' | 'frequency' | 'duration') => {
    const med = medicines[index];
    if (!med.name) return;

    setActiveField({ index, field });
    await fetchSuggestions(field, {
      medicineName: med.name,
      medicineType: med.type,
      diagnosis: diagnoses.map(d => d.name).join(', '),
      patientInfo,
    });
  };

  const handleFieldSelect = (index: number, field: keyof Medicine, value: string) => {
    handleMedicineChange(index, field, value);
    clearSuggestions();
    setActiveField(null);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-display text-foreground">Medicines</h3>
            <p className="text-sm text-muted-foreground">AI suggests medicines, dosage, and duration</p>
          </div>
        {(suggestionMode === 'ai' || suggestionMode === 'combined') && 
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
        {suggestionMode === 'saved' && 
          <BookOpen className="h-4 w-4 text-primary" />}
        </div>
        <TemplateManager
          templates={medicineTemplates}
          onSave={(name) => onSaveMedicineTemplate(name, medicines)}
          onLoad={(template) => onMedicinesChange(template.medicines)}
          onDelete={onDeleteMedicineTemplate}
          label="Medicine"
          disabled={medicines.length === 0 || !medicines.some(m => m.name)}
        />
      </div>

      {diagnoses.length === 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Add a diagnosis first to get AI-powered medicine suggestions</span>
        </div>
      )}

      <div className="space-y-4">
        {medicines.map((med, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-card/50 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={med.selected}
                  onCheckedChange={(checked) => handleMedicineChange(index, 'selected', checked)}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Medicine #{index + 1}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMedicine(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Medicine Name */}
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-sm font-medium">Medicine Name</Label>
                <AutoSuggestInput
                  value={med.name}
                  onChange={(v) => handleMedicineNameChange(index, v)}
                  onSelect={(item) => handleMedicineNameSelect(index, item)}
                  suggestions={getNameSuggestions(index)}
                  loading={false}
                  placeholder="Type to search saved medicines..."
                  displayKey="name"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select
                  value={med.type}
                  onValueChange={(v) => handleMedicineChange(index, 'type', v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {medicineTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Route</Label>
                <Select
                  value={med.route}
                  onValueChange={(v) => handleMedicineChange(index, 'route', v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dose */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dose</Label>
                <AutoSuggestInput
                  value={med.dose}
                  onChange={(v) => handleMedicineChange(index, 'dose', v)}
                  onSelect={(v) => handleFieldSelect(index, 'dose', typeof v === 'string' ? v : v.name || '')}
                  suggestions={activeField?.index === index && activeField?.field === 'dose' ? suggestions : []}
                  loading={loading && activeField?.index === index && activeField?.field === 'dose'}
                  placeholder="Click to get AI suggestions"
                  className="cursor-pointer"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchFieldSuggestions(index, 'dose')}
                  disabled={!med.name || loading}
                  className="text-xs h-7 px-2 text-primary hover:text-primary"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Suggest Dose
                </Button>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Frequency</Label>
                <AutoSuggestInput
                  value={med.frequency}
                  onChange={(v) => handleMedicineChange(index, 'frequency', v)}
                  onSelect={(v) => handleFieldSelect(index, 'frequency', typeof v === 'string' ? v : v.name || '')}
                  suggestions={activeField?.index === index && activeField?.field === 'frequency' ? suggestions : []}
                  loading={loading && activeField?.index === index && activeField?.field === 'frequency'}
                  placeholder="e.g., Twice daily"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchFieldSuggestions(index, 'frequency')}
                  disabled={!med.name || loading}
                  className="text-xs h-7 px-2 text-primary hover:text-primary"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Suggest Frequency
                </Button>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <AutoSuggestInput
                  value={med.duration}
                  onChange={(v) => handleMedicineChange(index, 'duration', v)}
                  onSelect={(v) => handleFieldSelect(index, 'duration', typeof v === 'string' ? v : v.name || '')}
                  suggestions={activeField?.index === index && activeField?.field === 'duration' ? suggestions : []}
                  loading={loading && activeField?.index === index && activeField?.field === 'duration'}
                  placeholder="e.g., 7 days"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchFieldSuggestions(index, 'duration')}
                  disabled={!med.name || loading}
                  className="text-xs h-7 px-2 text-primary hover:text-primary"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Suggest Duration
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={handleAddMedicine}
          className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>
    </div>
  );
}
