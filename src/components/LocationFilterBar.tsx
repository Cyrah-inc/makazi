import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Car, Bus, PersonStanding, MapPin, Search, Navigation, Loader2, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertyPurpose } from '@/types/property';

export type TransportMode = 'driving' | 'transit' | 'walking';
export type LocationFilterMode = 'commute' | 'nearme';

export interface CommuteSettings {
  destination: string;
  mode: TransportMode;
  maxMinutes: number;
}

export interface NearMeSettings {
  maxDistanceKm: number;
}

export interface LocationFilterBarProps {
  purpose: PropertyPurpose;
  filterMode: LocationFilterMode;
  onFilterModeChange: (mode: LocationFilterMode) => void;
  settings: CommuteSettings;
  onChange: (settings: CommuteSettings) => void;
  onSearch: () => void;
  isLoading?: boolean;
  nearMeSettings: NearMeSettings;
  onNearMeSettingsChange: (settings: NearMeSettings) => void;
  onNearMeActivate: () => void;
  isNearMeLoading?: boolean;
  isNearMeActive?: boolean;
  nearMeError?: string | null;
  commuteActive?: boolean;
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

const formatDistanceLabel = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

const purposeAccent: Record<PropertyPurpose, string> = {
  buy: 'bg-primary/10 text-primary border-primary/20',
  rent: 'bg-rent/10 text-rent border-rent/20',
  airbnb: 'bg-airbnb/10 text-airbnb border-airbnb/20',
};

const LocationFilterBar = ({
  purpose,
  filterMode,
  onFilterModeChange,
  settings,
  onChange,
  onSearch,
  isLoading,
  nearMeSettings,
  onNearMeSettingsChange,
  onNearMeActivate,
  isNearMeLoading,
  isNearMeActive,
  nearMeError,
  commuteActive,
  onClear,
}: LocationFilterBarProps) => {
  const [inputValue, setInputValue] = useState(settings.destination);
  const [expanded, setExpanded] = useState<'nearme' | 'commute' | null>(null);

  const anyActive = isNearMeActive || commuteActive;

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

  const handleNearMeClick = () => {
    if (expanded === 'nearme') {
      setExpanded(null);
    } else {
      setExpanded('nearme');
      onFilterModeChange('nearme');
    }
  };

  const handleCommuteClick = () => {
    if (expanded === 'commute') {
      setExpanded(null);
    } else {
      setExpanded('commute');
      onFilterModeChange('commute');
    }
  };

  const accent = purposeAccent[purpose];

  return (
    <div className="space-y-3">
      {/* Pill Buttons Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleNearMeClick}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all',
            isNearMeActive
              ? accent
              : expanded === 'nearme'
              ? 'bg-muted border-border text-foreground'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          )}
        >
          <Navigation className="h-4 w-4" />
          Near Me
          {isNearMeActive && (
            <span className="text-xs opacity-75">• {formatDistanceLabel(nearMeSettings.maxDistanceKm)}</span>
          )}
        </button>

        <button
          onClick={handleCommuteClick}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all',
            commuteActive
              ? accent
              : expanded === 'commute'
              ? 'bg-muted border-border text-foreground'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          )}
        >
          <Clock className="h-4 w-4" />
          Commute Time
          {commuteActive && settings.destination && (
            <span className="text-xs opacity-75">• {formatTime(settings.maxMinutes)}</span>
          )}
        </button>

        {anyActive && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded Panel - Near Me */}
      {expanded === 'nearme' && (
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <Button
              onClick={onNearMeActivate}
              disabled={isNearMeLoading}
              className="gap-2 h-10"
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
            {nearMeError && <p className="text-xs text-destructive">{nearMeError}</p>}
          </div>

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
      )}

      {/* Expanded Panel - Commute */}
      {expanded === 'commute' && (
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            {transportModes.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                type="button"
                variant={settings.mode === value ? 'default' : 'outline'}
                size="sm"
                className={cn('flex-1 gap-1.5 h-9 text-xs', settings.mode === value && 'shadow-sm')}
                onClick={() => onChange({ ...settings, mode: value })}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>

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

      {/* Active Location Chip */}
      {anyActive && (
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
          accent
        )}>
          {isNearMeActive ? (
            <>
              <Navigation className="h-3.5 w-3.5" />
              <span>Within {formatDistanceLabel(nearMeSettings.maxDistanceKm)} of you</span>
            </>
          ) : (
            <>
              {(() => { const ModeIcon = transportModes.find(m => m.value === settings.mode)?.icon || Bus; return <ModeIcon className="h-3.5 w-3.5" />; })()}
              <span>{formatTime(settings.maxMinutes)} to {settings.destination}</span>
            </>
          )}
          <button onClick={onClear} className="ml-0.5 hover:opacity-70 rounded-full p-0.5 transition-opacity">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationFilterBar;
