import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Car, Bus, PersonStanding, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransportMode = 'driving' | 'transit' | 'walking';

export interface CommuteSettings {
  destination: string;
  mode: TransportMode;
  maxMinutes: number;
}

interface CommuteCheckerProps {
  settings: CommuteSettings;
  onChange: (settings: CommuteSettings) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const transportModes: { value: TransportMode; icon: typeof Car; label: string }[] = [
  { value: 'driving', icon: Car, label: 'Drive' },
  { value: 'transit', icon: Bus, label: 'Transit' },
  { value: 'walking', icon: PersonStanding, label: 'Walk' },
];

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
};

const CommuteChecker = ({ settings, onChange, onSearch, isLoading }: CommuteCheckerProps) => {
  const [inputValue, setInputValue] = useState(settings.destination);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onChange({ ...settings, destination: inputValue.trim() });
      onSearch();
    }
  }, [inputValue, settings, onChange, onSearch]);

  const handleSearchClick = () => {
    if (inputValue.trim()) {
      onChange({ ...settings, destination: inputValue.trim() });
      onSearch();
    }
  };

  return (
    <div className="space-y-5 p-4 bg-accent/5 rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-sm">Commute Checker</h3>
          <p className="text-xs text-muted-foreground">Filter by travel time</p>
        </div>
      </div>

      {/* Destination Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Where do you commute to?</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter work or school location"
            className="pl-10 pr-10 h-11 bg-background border-input shadow-sm"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSearchClick}
            disabled={isLoading || !inputValue.trim()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transport Mode Toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Transport Mode</Label>
        <div className="flex gap-2">
          {transportModes.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              type="button"
              variant={settings.mode === value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 gap-1.5 h-9',
                settings.mode === value && 'shadow-sm'
              )}
              onClick={() => onChange({ ...settings, mode: value })}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Max Commute Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Max Commute</Label>
          <span className="text-sm font-semibold text-primary">
            {formatTime(settings.maxMinutes)}
          </span>
        </div>
        <Slider
          value={[settings.maxMinutes]}
          onValueChange={([value]) => onChange({ ...settings, maxMinutes: value })}
          min={15}
          max={120}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>2 hours</span>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {settings.destination && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing properties within{' '}
            <span className="font-medium text-foreground">{formatTime(settings.maxMinutes)}</span>
            {' '}of{' '}
            <span className="font-medium text-foreground">{settings.destination}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CommuteChecker;
