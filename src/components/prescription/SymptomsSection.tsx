import React, { useEffect, useState } from 'react';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePrescriptionSuggestions } from '@/hooks/usePrescriptionSuggestions';
import { Stethoscope, X, Sparkles } from 'lucide-react';

interface SymptomsSectionProps {
  symptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  clinicalFindings: string;
  onClinicalFindingsChange: (findings: string) => void;
}

export function SymptomsSection({
  symptoms,
  onSymptomsChange,
  clinicalFindings,
  onClinicalFindingsChange,
}: SymptomsSectionProps) {
  const [symptomInput, setSymptomInput] = useState('');
  const { loading, suggestions, fetchSuggestions, clearSuggestions } = usePrescriptionSuggestions();

  useEffect(() => {
    if (symptomInput.length >= 2) {
      fetchSuggestions('symptoms', {}, symptomInput);
    } else {
      clearSuggestions();
    }
  }, [symptomInput]);

  const handleAddSymptom = (symptom: string | { name?: string }) => {
    const symptomText = typeof symptom === 'string' ? symptom : symptom.name || '';
    if (symptomText && !symptoms.includes(symptomText)) {
      onSymptomsChange([...symptoms, symptomText]);
    }
    setSymptomInput('');
    clearSuggestions();
  };

  const handleRemoveSymptom = (symptom: string) => {
    onSymptomsChange(symptoms.filter((s) => s !== symptom));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display text-foreground">Symptoms & Complaints</h3>
          <p className="text-sm text-muted-foreground">AI will suggest relevant symptoms as you type</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Symptoms</Label>
          <AutoSuggestInput
            value={symptomInput}
            onChange={setSymptomInput}
            onSelect={handleAddSymptom}
            suggestions={suggestions}
            loading={loading}
            placeholder="Type to search symptoms (e.g., Fever, Headache)..."
          />
        </div>

        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-secondary/30 border border-border">
            {symptoms.map((symptom, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1.5 text-sm font-medium flex items-center gap-2 bg-card hover:bg-secondary transition-colors"
              >
                {symptom}
                <button
                  onClick={() => handleRemoveSymptom(symptom)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="clinicalFindings" className="text-sm font-medium">
            Clinical Findings
          </Label>
          <Textarea
            id="clinicalFindings"
            value={clinicalFindings}
            onChange={(e) => onClinicalFindingsChange(e.target.value)}
            placeholder="Enter clinical examination findings..."
            className="min-h-24 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
