import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Car, Bus, PersonStanding, MapPin, Search, ChevronDown, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommuteSettings, TransportMode } from './CommuteChecker';

interface CommuteBarProps {
  settings: CommuteSettings;
  onChange: (settings: CommuteSettings) => void;
  onSearch: () => void;
  isLoading?: boolean;
  isActive: boolean;
  onClear: () => void;
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

const CommuteBar = ({ settings, onChange, onSearch, isLoading, isActive, onClear }: CommuteBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onClear();
    setIsOpen(false);
  };

  const ModeIcon = transportModes.find(m => m.value === settings.mode)?.icon || Bus;

  return (
    <div className="container">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
              isActive
                ? 'bg-primary/5 border-primary/20'
                : 'bg-accent/5 border-border hover:border-primary/20',
              isOpen && 'rounded-b-none border-b-0'
            )}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
              isActive ? 'bg-primary/10' : 'bg-muted'
            )}>
              {isActive ? <ModeIcon className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
            </div>

            <div className="flex-1 min-w-0">
              {isActive ? (
                <p className="text-sm font-medium text-foreground truncate">
                  Within {formatTime(settings.maxMinutes)} of {settings.destination}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Filter by commute time</p>
              )}
            </div>

            {isActive ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground shrink-0 transition-transform',
                isOpen && 'rotate-180'
              )} />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn(
            'px-4 pb-4 pt-3 space-y-4 border border-t-0 rounded-b-xl',
            isActive ? 'border-primary/20 bg-primary/5' : 'border-border bg-accent/5'
          )}>
            {/* Destination Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Where do you commute to?</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter work or school location"
                  className="pl-10 pr-10 h-10 bg-background text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleSearchClick}
                  disabled={isLoading || !inputValue.trim()}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Transport Mode */}
            <div className="flex gap-2">
              {transportModes.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={settings.mode === value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'flex-1 gap-1.5 h-9 text-xs',
                    settings.mode === value && 'shadow-sm'
                  )}
                  onClick={() => onChange({ ...settings, mode: value })}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Max Commute Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Max Commute
                </Label>
                <span className="text-xs font-semibold text-primary">
                  {formatTime(settings.maxMinutes)}
                </span>
              </div>
              <Slider
                value={[settings.maxMinutes]}
                onValueChange={([value]) => onChange({ ...settings, maxMinutes: value })}
                min={15}
                max={120}
                step={5}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>15 min</span>
                <span>2 hours</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CommuteBar;
