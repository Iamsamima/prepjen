import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill, Plus, Search, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToJSON, importFromCSV, importFromJSON } from '@/utils/importExport';

interface SavedMedicine {
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
const MEDICINE_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder'];
const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Nasal', 'Rectal'];
const CATEGORIES = ['General', 'Antibiotic', 'Analgesic', 'Antihypertensive', 'Antidiabetic', 'Vitamin', 'Other'];

export function MedicineSettings() {
  const [medicines, setMedicines] = useState<SavedMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newMedicine, setNewMedicine] = useState<Omit<SavedMedicine, 'id'>>({
    name: '', type: 'Tablet', defaultDose: '', defaultFrequency: '',
    defaultRoute: 'Oral', defaultDuration: '', category: 'General',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setMedicines(JSON.parse(stored));
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const save = useCallback((updated: SavedMedicine[]) => {
    setMedicines(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const filteredMedicines = useMemo(() => {
    let result = medicines;
    if (debouncedSearch) {
      try {
        const regex = new RegExp(debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        result = result.filter(m => regex.test(m.name) || regex.test(m.category));
      } catch { /* ignore invalid regex */ }
    }
    if (filterCategory !== 'all') {
      result = result.filter(m => m.category === filterCategory);
    }
    return result;
  }, [medicines, debouncedSearch, filterCategory]);

  const addMedicine = () => {
    if (!newMedicine.name.trim()) { toast.error('Medicine name is required'); return; }
    const med: SavedMedicine = { id: Date.now().toString(), ...newMedicine, name: newMedicine.name.trim() };
    save([...medicines, med]);
    setNewMedicine({ name: '', type: 'Tablet', defaultDose: '', defaultFrequency: '', defaultRoute: 'Oral', defaultDuration: '', category: 'General' });
    toast.success('Medicine added!');
  };

  const deleteMedicine = (id: string) => {
    save(medicines.filter(m => m.id !== id));
    toast.success('Medicine removed');
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!medicines.length) { toast.error('No medicines to export'); return; }
    format === 'csv' ? exportToCSV(medicines, 'medicines') : exportToJSON(medicines, 'medicines');
    toast.success(`Exported ${medicines.length} medicines as ${format.toUpperCase()}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isJSON = file.name.endsWith('.json');
      const data = isJSON
        ? await importFromJSON<SavedMedicine>(file)
        : await importFromCSV<any>(file);
      const imported = data.map((item: any) => ({
        id: item.id || Date.now().toString() + Math.random().toString(36).slice(2),
        name: item.name || '',
        type: item.type || 'Tablet',
        defaultDose: item.defaultDose || '',
        defaultFrequency: item.defaultFrequency || '',
        defaultRoute: item.defaultRoute || 'Oral',
        defaultDuration: item.defaultDuration || '',
        category: item.category || 'General',
      })).filter((m: SavedMedicine) => m.name.trim());
      save([...medicines, ...imported]);
      toast.success(`Imported ${imported.length} medicines`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold font-display">Medicine Database</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <label>
              <Upload className="h-3.5 w-3.5" /> Import
              <input type="file" accept=".csv,.json" className="hidden" onChange={handleImport} />
            </label>
          </Button>
        </div>
      </div>

      {/* Add Medicine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Medicine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newMedicine.name} onChange={e => setNewMedicine(m => ({ ...m, name: e.target.value }))} placeholder="Medicine name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newMedicine.type} onValueChange={v => setNewMedicine(m => ({ ...m, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MEDICINE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newMedicine.category} onValueChange={v => setNewMedicine(m => ({ ...m, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Dose</Label>
              <Input value={newMedicine.defaultDose} onChange={e => setNewMedicine(m => ({ ...m, defaultDose: e.target.value }))} placeholder="e.g., 500mg" />
            </div>
            <div className="space-y-2">
              <Label>Default Frequency</Label>
              <Input value={newMedicine.defaultFrequency} onChange={e => setNewMedicine(m => ({ ...m, defaultFrequency: e.target.value }))} placeholder="e.g., Twice daily" />
            </div>
            <div className="space-y-2">
              <Label>Default Route</Label>
              <Select value={newMedicine.defaultRoute} onValueChange={v => setNewMedicine(m => ({ ...m, defaultRoute: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Duration</Label>
              <Input value={newMedicine.defaultDuration} onChange={e => setNewMedicine(m => ({ ...m, defaultDuration: e.target.value }))} placeholder="e.g., 7 days" />
            </div>
          </div>
          <Button onClick={addMedicine} className="gap-2">
            <Plus className="h-4 w-4" /> Add Medicine
          </Button>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved Medicines ({filteredMedicines.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search medicines..."
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filteredMedicines.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMedicines.map(med => (
                <div key={med.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{med.name}</span>
                      <Badge variant="secondary" className="text-xs">{med.type}</Badge>
                      <Badge variant="outline" className="text-xs">{med.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[med.defaultDose, med.defaultFrequency, med.defaultRoute, med.defaultDuration].filter(Boolean).join(' • ') || 'No defaults set'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMedicine(med.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {medicines.length === 0 ? 'No medicines saved yet. Add your frequently used medicines above.' : 'No medicines match your search.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
