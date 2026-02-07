import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Car, Bus, PersonStanding, MapPin, Search, ChevronDown, X, Clock, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommuteSettings, TransportMode, LocationFilterMode, NearMeSettings } from './CommuteChecker';

interface CommuteBarProps {
  filterMode: LocationFilterMode;
  onFilterModeChange: (mode: LocationFilterMode) => void;
  settings: CommuteSettings;
  onChange: (settings: CommuteSettings) => void;
  onSearch: () => void;
  isLoading?: boolean;
  isActive: boolean;
  onClear: () => void;
  // Near Me
  nearMeSettings: NearMeSettings;
  onNearMeSettingsChange: (settings: NearMeSettings) => void;
  onNearMeActivate: () => void;
  isNearMeLoading?: boolean;
  isNearMeActive?: boolean;
  nearMeError?: string | null;
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

const formatDistanceLabel = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

const CommuteBar = ({
  filterMode,
  onFilterModeChange,
  settings,
  onChange,
  onSearch,
  isLoading,
  isActive,
  onClear,
  nearMeSettings,
  onNearMeSettingsChange,
  onNearMeActivate,
  isNearMeLoading,
  isNearMeActive,
  nearMeError,
}: CommuteBarProps) => {
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
  const anyActive = isActive || isNearMeActive;

  const getSummaryText = () => {
    if (isNearMeActive) {
      return `Properties within ${formatDistanceLabel(nearMeSettings.maxDistanceKm)} of you`;
    }
    if (isActive && settings.destination) {
      return `Within ${formatTime(settings.maxMinutes)} of ${settings.destination}`;
    }
    return 'Filter by location or proximity';
  };

  return (
    <div className="container">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
              anyActive
                ? 'bg-primary/5 border-primary/20'
                : 'bg-accent/5 border-border hover:border-primary/20',
              isOpen && 'rounded-b-none border-b-0'
            )}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
              anyActive ? 'bg-primary/10' : 'bg-muted'
            )}>
              {isNearMeActive ? (
                <Navigation className="h-4 w-4 text-primary" />
              ) : isActive ? (
                <ModeIcon className="h-4 w-4 text-primary" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm truncate',
                anyActive ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
                {getSummaryText()}
              </p>
            </div>

            {anyActive ? (
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
            anyActive ? 'border-primary/20 bg-primary/5' : 'border-border bg-accent/5'
          )}>
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                onClick={() => onFilterModeChange('nearme')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                  filterMode === 'nearme'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Navigation className="h-3.5 w-3.5" />
                Near Me
              </button>
              <button
                onClick={() => onFilterModeChange('commute')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                  filterMode === 'commute'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Car className="h-3.5 w-3.5" />
                Commute
              </button>
            </div>

            {filterMode === 'nearme' ? (
              /* Near Me Mode */
              <div className="space-y-3">
                <Button
                  onClick={onNearMeActivate}
                  disabled={isNearMeLoading}
                  className="w-full gap-2 h-10"
                  size="sm"
                  variant={isNearMeActive ? 'secondary' : 'default'}
                >
                  {isNearMeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {isNearMeLoading ? 'Getting location...' : isNearMeActive ? 'Location active' : 'Use My Location'}
                </Button>

                {nearMeError && (
                  <p className="text-xs text-destructive">{nearMeError}</p>
                )}

                {/* Radius Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      Max Distance
                    </Label>
                    <span className="text-xs font-semibold text-primary">
                      {formatDistanceLabel(nearMeSettings.maxDistanceKm)}
                    </span>
                  </div>
                  <Slider
                    value={[nearMeSettings.maxDistanceKm]}
                    onValueChange={([value]) => onNearMeSettingsChange({ ...nearMeSettings, maxDistanceKm: value })}
                    min={1}
                    max={50}
                    step={1}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Commute Mode */
              <div className="space-y-3">
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
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CommuteBar;
