import React, { useEffect, useState } from 'react';
import { AutoSuggestInput } from '@/components/ui/AutoSuggestInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePrescriptionSuggestions } from '@/hooks/usePrescriptionSuggestions';
import { FlaskConical, X, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { SuggestionMode } from '@/types/suggestion';

interface DiagnosticTest {
  testName: string;
  testType?: string;
  reason?: string;
}

interface TestsSectionProps {
  symptoms: string[];
  diagnoses: { name: string }[];
  tests: DiagnosticTest[];
  onTestsChange: (tests: DiagnosticTest[]) => void;
  suggestionMode?: SuggestionMode;
}

export function TestsSection({
  symptoms,
  diagnoses,
  tests,
  onTestsChange,
  suggestionMode = 'combined',
}: TestsSectionProps) {
  const [testInput, setTestInput] = useState('');
  const [hasFetchedAI, setHasFetchedAI] = useState(false);
  const { loading, suggestions, fetchSuggestions, clearSuggestions } = usePrescriptionSuggestions();

  const useAI = suggestionMode === 'ai' || suggestionMode === 'combined';

  // Auto-fetch test suggestions when diagnoses change
  useEffect(() => {
    if (diagnoses.length > 0 && !hasFetchedAI && useAI) {
      fetchSuggestions('tests', {
        diagnosis: diagnoses.map(d => d.name).join(', '),
        symptoms: symptoms.join(', '),
      });
      setHasFetchedAI(true);
    }
  }, [diagnoses, useAI]);

  // Reset when diagnoses clear
  useEffect(() => {
    if (diagnoses.length === 0) {
      setHasFetchedAI(false);
      clearSuggestions();
    }
  }, [diagnoses]);

  const handleAddTest = (test: any) => {
    const testObj: DiagnosticTest = typeof test === 'string'
      ? { testName: test }
      : {
          testName: test.testName || test.name || '',
          testType: test.testType,
          reason: test.reason,
        };

    if (testObj.testName && !tests.some(t => t.testName === testObj.testName)) {
      onTestsChange([...tests, testObj]);
    }
    setTestInput('');
    clearSuggestions();
  };

  const handleRemoveTest = (testName: string) => {
    onTestsChange(tests.filter((t) => t.testName !== testName));
  };

  const getTestTypeColor = (testType?: string) => {
    switch (testType?.toLowerCase()) {
      case 'blood': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'urine': return 'bg-warning/10 text-warning border-warning/30';
      case 'imaging': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const getTestTypeBadgeVariant = (testType?: string) => {
    switch (testType?.toLowerCase()) {
      case 'blood': return 'destructive';
      case 'urine': return 'secondary';
      case 'imaging': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display text-foreground">Diagnostic Tests</h3>
          <p className="text-sm text-muted-foreground">AI suggests tests based on diagnosis</p>
        </div>
        {(suggestionMode === 'ai' || suggestionMode === 'combined') && 
          <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />}
        {suggestionMode === 'saved' && 
          <BookOpen className="h-4 w-4 text-primary ml-auto" />}
      </div>

      {diagnoses.length === 0 && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Add a diagnosis first to get AI-powered test suggestions</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Diagnostic Test</Label>
          <AutoSuggestInput
            value={testInput}
            onChange={setTestInput}
            onSelect={handleAddTest}
            suggestions={suggestions}
            loading={loading}
            placeholder="Type or select from AI suggestions..."
            displayKey="testName"
          />
        </div>

        {tests.length > 0 && (
          <div className="space-y-2 p-4 rounded-lg bg-secondary/30 border border-border">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getTestTypeColor(test.testType)}`}
              >
                <div className="flex-1">
                  <div className="font-medium">{test.testName}</div>
                  {test.reason && (
                    <div className="text-sm opacity-80 mt-0.5">{test.reason}</div>
                  )}
                </div>
                {test.testType && (
                  <Badge variant={getTestTypeBadgeVariant(test.testType) as any} className="mr-3 capitalize">
                    {test.testType}
                  </Badge>
                )}
                <button
                  onClick={() => handleRemoveTest(test.testName)}
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
