import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface SaveAllTemplatesDialogProps {
  hasMedicines: boolean;
  hasDiagnoses: boolean;
  hasFullPrescription: boolean;
  onSaveMedicineTemplate: (name: string) => void;
  onSaveDiagnosisTemplate: (name: string) => void;
  onSavePrescriptionTemplate: (name: string) => void;
}

export function SaveAllTemplatesDialog({
  hasMedicines,
  hasDiagnoses,
  hasFullPrescription,
  onSaveMedicineTemplate,
  onSaveDiagnosisTemplate,
  onSavePrescriptionTemplate,
}: SaveAllTemplatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saveMedicine, setSaveMedicine] = useState(true);
  const [saveDiagnosis, setSaveDiagnosis] = useState(true);
  const [savePrescription, setSavePrescription] = useState(true);

  const canSave = hasMedicines || hasDiagnoses || hasFullPrescription;

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const name = templateName.trim();
    let count = 0;

    if (saveMedicine && hasMedicines) {
      onSaveMedicineTemplate(name);
      count++;
    }
    if (saveDiagnosis && hasDiagnoses) {
      onSaveDiagnosisTemplate(name);
      count++;
    }
    if (savePrescription && hasFullPrescription) {
      onSavePrescriptionTemplate(name);
      count++;
    }

    if (count > 0) {
      toast.success(`Saved ${count} template(s) as "${name}"`);
    } else {
      toast.error('No templates selected to save');
    }
    setTemplateName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canSave}>
          <Save className="h-4 w-4 mr-1" />
          Save Templates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Templates</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select what to save:</p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="save-medicine"
                checked={saveMedicine}
                onCheckedChange={(c) => setSaveMedicine(!!c)}
                disabled={!hasMedicines}
              />
              <Label htmlFor="save-medicine" className="text-sm">Medicine Template</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="save-diagnosis"
                checked={saveDiagnosis}
                onCheckedChange={(c) => setSaveDiagnosis(!!c)}
                disabled={!hasDiagnoses}
              />
              <Label htmlFor="save-diagnosis" className="text-sm">Diagnosis Template</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="save-prescription"
                checked={savePrescription}
                onCheckedChange={(c) => setSavePrescription(!!c)}
                disabled={!hasFullPrescription}
              />
              <Label htmlFor="save-prescription" className="text-sm">Full Prescription Template</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
