import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface AutoSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: any) => void;
  suggestions: any[];
  loading?: boolean;
  placeholder?: string;
  displayKey?: string;
  className?: string;
  disabled?: boolean;
}

export function AutoSuggestInput({
  value,
  onChange,
  onSelect,
  suggestions,
  loading = false,
  placeholder,
  displayKey = 'name',
  className,
  disabled = false,
}: AutoSuggestInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (suggestions.length > 0 && value) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [suggestions, value]);

  const handleSelect = (item: any) => {
    const displayValue = typeof item === 'string' ? item : item[displayKey] || item.name || '';
    onChange(displayValue);
    onSelect?.(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getDisplayValue = (item: any) => {
    if (typeof item === 'string') return item;
    return item[displayKey] || item.name || JSON.stringify(item);
  };

  const getSecondaryValue = (item: any) => {
    if (typeof item === 'string') return null;
    return item.description || item.genericName || item.confidence || null;
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-10 transition-all duration-200',
            isOpen && 'ring-2 ring-primary/20'
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
        {!loading && suggestions.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-popover shadow-elevated animate-fade-in"
        >
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className={cn(
                'px-4 py-3 cursor-pointer transition-colors',
                'hover:bg-secondary',
                highlightedIndex === index && 'bg-secondary',
                index !== suggestions.length - 1 && 'border-b border-border/50'
              )}
            >
              <div className="font-medium text-foreground">
                {getDisplayValue(item)}
              </div>
              {getSecondaryValue(item) && (
                <div className="text-sm text-muted-foreground mt-0.5">
                  {getSecondaryValue(item)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
