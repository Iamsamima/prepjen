import { useState, useEffect, useCallback } from 'react';

export interface SavedMedicine {
  id: string;
  name: string;
  type: string;
  defaultDose: string;
  defaultFrequency: string;
  defaultRoute: string;
  defaultDuration: string;
  category: string;
}

const STORAGE_KEY = 'app_saved_medicines';

export function useSavedMedicines() {
  const [medicines, setMedicines] = useState<SavedMedicine[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setMedicines(JSON.parse(stored));
  }, []);

  const searchMedicines = useCallback((query: string): SavedMedicine[] => {
    if (!query || query.length < 1) return [];
    const lower = query.toLowerCase();
    return medicines
      .filter(m => m.name.toLowerCase().includes(lower))
      .slice(0, 10);
  }, [medicines]);

  return { savedMedicines: medicines, searchMedicines };
}
