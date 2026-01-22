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

interface CacheEntry {
  suggestions: any[];
  timestamp: number;
}

// Module-level cache that persists across hook instances
const suggestionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 100;
const DEBOUNCE_DELAY = 600; // 600ms debounce to reduce API calls

function getCacheKey(type: SuggestionType, context: SuggestionContext, query?: string): string {
  return JSON.stringify({ type, context, query: query?.toLowerCase().trim() });
}

function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of suggestionCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      suggestionCache.delete(key);
    }
  }
  // If still too large, remove oldest entries
  if (suggestionCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(suggestionCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => suggestionCache.delete(key));
  }
}

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
        const cacheKey = getCacheKey(type, context, query);
        
        // Check cache first
        const cached = suggestionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log('Cache hit for:', type, query);
          setSuggestions(cached.suggestions);
          resolve(cached.suggestions);
          return;
        }

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
          
          // Store in cache
          cleanupCache();
          suggestionCache.set(cacheKey, {
            suggestions: result,
            timestamp: Date.now(),
          });
          console.log('Cached result for:', type, query);

          setSuggestions(result);
          resolve(result);
        } catch (e) {
          console.error('Failed to fetch suggestions:', e);
          resolve([]);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_DELAY);
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
