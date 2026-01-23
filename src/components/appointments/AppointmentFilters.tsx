import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateFilter } from '@/hooks/useAppointments';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentFiltersProps {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  customDateRange: { from: Date; to: Date };
  setCustomDateRange: (range: { from: Date; to: Date }) => void;
}

export function AppointmentFilters({
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange,
}: AppointmentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={dateFilter === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDateFilter('today')}
      >
        Today
      </Button>
      <Button
        variant={dateFilter === 'tomorrow' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDateFilter('tomorrow')}
      >
        Tomorrow
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={dateFilter === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-2')}
            onClick={() => setDateFilter('custom')}
          >
            <CalendarIcon className="h-4 w-4" />
            {dateFilter === 'custom'
              ? `${format(customDateRange.from, 'MMM dd')} - ${format(customDateRange.to, 'MMM dd')}`
              : 'Custom Range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: customDateRange.from, to: customDateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setCustomDateRange({ from: range.from, to: range.to });
                setDateFilter('custom');
              } else if (range?.from) {
                setCustomDateRange({ from: range.from, to: range.from });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
