import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SavedTest {
  id: string;
  name: string;
  type: string;
  category: string;
  normalRange: string;
  cost: string;
}

const STORAGE_KEY = 'app_saved_tests';
const TEST_TYPES = ['Blood', 'Urine', 'Imaging', 'Pathology', 'Microbiology', 'ECG', 'Other'];
const TEST_CATEGORIES = ['Routine', 'Specialized', 'Emergency', 'Preventive', 'Follow-up'];

export function TestsSettings() {
  const [tests, setTests] = useState<SavedTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newTest, setNewTest] = useState<Omit<SavedTest, 'id'>>({
    name: '', type: 'Blood', category: 'Routine', normalRange: '', cost: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTests(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const save = useCallback((updated: SavedTest[]) => {
    setTests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const filteredTests = useMemo(() => {
    let result = tests;
    if (debouncedSearch) {
      try {
        const regex = new RegExp(debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        result = result.filter(t => regex.test(t.name) || regex.test(t.category));
      } catch { /* ignore */ }
    }
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }
    return result;
  }, [tests, debouncedSearch, filterType]);

  const addTest = () => {
    if (!newTest.name.trim()) { toast.error('Test name is required'); return; }
    save([...tests, { id: Date.now().toString(), ...newTest, name: newTest.name.trim() }]);
    setNewTest({ name: '', type: 'Blood', category: 'Routine', normalRange: '', cost: '' });
    toast.success('Test added!');
  };

  const deleteTest = (id: string) => {
    save(tests.filter(t => t.id !== id));
    toast.success('Test removed');
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Blood': return 'destructive';
      case 'Urine': return 'secondary';
      case 'Imaging': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold font-display">Test Database</h2>
      </div>

      {/* Add Test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Diagnostic Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Test Name *</Label>
              <Input value={newTest.name} onChange={e => setNewTest(t => ({ ...t, name: e.target.value }))} placeholder="e.g., CBC, Lipid Profile" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newTest.type} onValueChange={v => setNewTest(t => ({ ...t, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newTest.category} onValueChange={v => setNewTest(t => ({ ...t, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TEST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Normal Range</Label>
              <Input value={newTest.normalRange} onChange={e => setNewTest(t => ({ ...t, normalRange: e.target.value }))} placeholder="e.g., 4.5-11.0 x10³/µL" />
            </div>
            <div className="space-y-2">
              <Label>Cost (₹)</Label>
              <Input type="number" value={newTest.cost} onChange={e => setNewTest(t => ({ ...t, cost: e.target.value }))} placeholder="e.g., 500" />
            </div>
          </div>
          <Button onClick={addTest} className="gap-2">
            <Plus className="h-4 w-4" /> Add Test
          </Button>
        </CardContent>
      </Card>

      {/* Search & List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved Tests ({filteredTests.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tests..." className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filteredTests.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTests.map(test => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{test.name}</span>
                      <Badge variant={getTypeBadgeColor(test.type) as any} className="text-xs">{test.type}</Badge>
                      <Badge variant="outline" className="text-xs">{test.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[test.normalRange && `Range: ${test.normalRange}`, test.cost && `₹${test.cost}`].filter(Boolean).join(' • ') || 'No details set'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTest(test.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {tests.length === 0 ? 'No tests saved yet. Add your commonly ordered tests above.' : 'No tests match your search.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
