import React from 'react';
import { SuggestionMode } from '@/types/suggestion';
import { Sparkles, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionModeSwitchProps {
  mode: SuggestionMode;
  onChange: (mode: SuggestionMode) => void;
}

const modes: { value: SuggestionMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'ai', label: 'AI', icon: Sparkles, description: 'AI-powered suggestions' },
  { value: 'saved', label: 'Saved', icon: BookOpen, description: 'From saved templates' },
  { value: 'combined', label: 'Combined', icon: Layers, description: 'AI + Saved templates' },
];

export function SuggestionModeSwitch({ mode, onChange }: SuggestionModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            title={m.description}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
