import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Save, FolderOpen, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  createdAt: number;
}

interface TemplateManagerProps<T extends Template> {
  templates: T[];
  onSave: (name: string) => void;
  onLoad: (template: T) => void;
  onDelete: (id: string) => void;
  label: string;
  disabled?: boolean;
}

export function TemplateManager<T extends Template>({
  templates,
  onSave,
  onLoad,
  onDelete,
  label,
  disabled = false,
}: TemplateManagerProps<T>) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    onSave(templateName.trim());
    setTemplateName('');
    setSaveDialogOpen(false);
    toast.success(`${label} template saved!`);
  };

  const handleLoad = (template: T) => {
    onLoad(template);
    toast.success(`Loaded "${template.name}" template`);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    toast.success(`Deleted "${name}" template`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Template */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Save className="h-4 w-4 mr-1" />
            Save {label}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save {label} Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={templates.length === 0}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Load
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {templates.length === 0 ? (
            <DropdownMenuItem disabled>No saved templates</DropdownMenuItem>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleLoad(template)}
              >
                <span className="truncate flex-1">{template.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(template.id, template.name, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
