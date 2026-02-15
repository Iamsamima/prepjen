import React, { useEffect, useState, useMemo } from 'react';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrescriptionSuggestions } from '@/hooks/usePrescriptionSuggestions';
import { TemplateManager } from '@/components/prescription/TemplateManager';
import { Brain, X, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { SuggestionMode } from '@/types/suggestion';

interface Diagnosis {
  name: string;
  confidence?: string;
  description?: string;
}

interface DiagnosisTemplate {
  id: string;
  name: string;
  diagnoses: Diagnosis[];
  diagnosisType: string;
  createdAt: number;
}

interface DiagnosisSectionProps {
  symptoms: string[];
  diagnoses: Diagnosis[];
  onDiagnosesChange: (diagnoses: Diagnosis[]) => void;
  diagnosisType: string;
  onDiagnosisTypeChange: (type: string) => void;
  diagnosisTemplates: DiagnosisTemplate[];
  onSaveDiagnosisTemplate: (name: string, diagnoses: Diagnosis[], diagnosisType: string) => void;
  onDeleteDiagnosisTemplate: (id: string) => void;
  onTrackDiagnosisUsage: (name: string) => void;
  getSavedDiagnosisSuggestions: (query: string) => { name: string; source: string }[];
  suggestionMode?: SuggestionMode;
}

export function DiagnosisSection({
  symptoms,
  diagnoses,
  onDiagnosesChange,
  diagnosisType,
  onDiagnosisTypeChange,
  diagnosisTemplates,
  onSaveDiagnosisTemplate,
  onDeleteDiagnosisTemplate,
  onTrackDiagnosisUsage,
  getSavedDiagnosisSuggestions,
  suggestionMode = 'combined',
}: DiagnosisSectionProps) {
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [hasFetchedAI, setHasFetchedAI] = useState(false);
  const { loading, suggestions, fetchSuggestions, clearSuggestions } = usePrescriptionSuggestions();

  const useAI = suggestionMode === 'ai' || suggestionMode === 'combined';
  const useSaved = suggestionMode === 'saved' || suggestionMode === 'combined';

  // Auto-fetch diagnosis suggestions when symptoms change
  useEffect(() => {
    if (symptoms.length > 0 && !hasFetchedAI && useAI) {
      fetchSuggestions('diagnosis', { symptoms: symptoms.join(', ') });
      setHasFetchedAI(true);
    }
  }, [symptoms, useAI]);

  // Reset when symptoms clear
  useEffect(() => {
    if (symptoms.length === 0) {
      setHasFetchedAI(false);
      clearSuggestions();
    }
  }, [symptoms]);

  // Combine suggestions based on mode
  const combinedSuggestions = useMemo(() => {
    const savedSuggestions = useSaved ? getSavedDiagnosisSuggestions(diagnosisInput) : [];
    const aiSuggestions = useAI ? suggestions.map((s: any) => ({ ...s, source: 'ai' })) : [];
    
    const all = [...savedSuggestions, ...aiSuggestions];
    const seen = new Set<string>();
    return all.filter(s => {
      const key = s.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suggestions, diagnosisInput, getSavedDiagnosisSuggestions, useAI, useSaved]);

  const handleAddDiagnosis = (diagnosis: any) => {
    const diagObj: Diagnosis = typeof diagnosis === 'string' 
      ? { name: diagnosis } 
      : { 
          name: diagnosis.name || '', 
          confidence: diagnosis.confidence,
          description: diagnosis.description 
        };
    
    if (diagObj.name && !diagnoses.some(d => d.name === diagObj.name)) {
      onDiagnosesChange([...diagnoses, diagObj]);
      onTrackDiagnosisUsage(diagObj.name);
    }
    setDiagnosisInput('');
    clearSuggestions();
  };

  const handleRemoveDiagnosis = (name: string) => {
    onDiagnosesChange(diagnoses.filter((d) => d.name !== name));
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-success/10 text-success border-success/30';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display text-foreground">Diagnosis</h3>
          <p className="text-sm text-muted-foreground">AI suggests diagnoses based on symptoms</p>
        </div>
        {(suggestionMode === 'ai' || suggestionMode === 'combined') && 
          <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />}
        {suggestionMode === 'saved' && 
          <BookOpen className="h-4 w-4 text-primary ml-auto" />}
      </div>

      {symptoms.length === 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Add symptoms first to get AI-powered diagnosis suggestions</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-medium">Diagnosis Type</Label>
            <Select value={diagnosisType} onValueChange={onDiagnosisTypeChange}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provisional">Provisional Diagnosis</SelectItem>
                <SelectItem value="confirmed">Confirmed Diagnosis</SelectItem>
                <SelectItem value="differential">Differential Diagnosis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-6">
            <TemplateManager
              templates={diagnosisTemplates}
              onSave={(name) => onSaveDiagnosisTemplate(name, diagnoses, diagnosisType)}
              onLoad={(template) => {
                onDiagnosesChange(template.diagnoses);
                onDiagnosisTypeChange(template.diagnosisType);
              }}
              onDelete={onDeleteDiagnosisTemplate}
              label="Diagnosis"
              disabled={diagnoses.length === 0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Diagnosis</Label>
          <AutoSuggestInput
            value={diagnosisInput}
            onChange={setDiagnosisInput}
            onSelect={handleAddDiagnosis}
            suggestions={combinedSuggestions}
            loading={loading}
            placeholder="Type or select from AI suggestions..."
            displayKey="name"
          />
        </div>

        {diagnoses.length > 0 && (
          <div className="space-y-2 p-4 rounded-lg bg-secondary/30 border border-border">
            {diagnoses.map((diagnosis, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getConfidenceColor(diagnosis.confidence)}`}
              >
                <div className="flex-1">
                  <div className="font-medium">{diagnosis.name}</div>
                  {diagnosis.description && (
                    <div className="text-sm opacity-80 mt-0.5">{diagnosis.description}</div>
                  )}
                </div>
                {diagnosis.confidence && (
                  <Badge variant="outline" className="mr-3 capitalize">
                    {diagnosis.confidence}
                  </Badge>
                )}
                <button
                  onClick={() => handleRemoveDiagnosis(diagnosis.name)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
