import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuggestionContext {
  symptoms?: string;
  diagnosis?: string;
  medicineName?: string;
  medicineType?: string;
  patientInfo?: {
    age?: string;
    gender?: string;
    weight?: string;
  };
}

type SuggestionType = 'symptoms' | 'diagnosis' | 'medicines' | 'dosage' | 'frequency' | 'duration' | 'tests' | 'dose';

export function usePrescriptionSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = useCallback(async (
    type: SuggestionType,
    context: SuggestionContext,
    query?: string
  ) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise<any[]>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('prescription-suggest', {
            body: { type, context, query },
          });

          if (error) {
            console.error('Suggestion error:', error);
            if (error.message?.includes('429')) {
              toast.error('Rate limit exceeded. Please wait a moment.');
            } else if (error.message?.includes('402')) {
              toast.error('AI credits exhausted. Please add more credits.');
            }
            resolve([]);
            return;
          }

          const result = data?.suggestions || [];
          setSuggestions(result);
          resolve(result);
        } catch (e) {
          console.error('Failed to fetch suggestions:', e);
          resolve([]);
        } finally {
          setLoading(false);
        }
      }, 400);
    });
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    loading,
    suggestions,
    fetchSuggestions,
    clearSuggestions,
  };
}
