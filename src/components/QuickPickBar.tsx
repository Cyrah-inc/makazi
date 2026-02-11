import { cn } from '@/lib/utils';
import { PropertyType, PROPERTY_TYPES } from '@/types/property';

interface QuickPickBarProps {
  selected?: PropertyType;
  onSelect: (type?: PropertyType) => void;
  /** Optional custom picks with icons */
  picks?: { value: string; label: string; icon?: React.ReactNode }[];
}

const QuickPickBar = ({ selected, onSelect, picks }: QuickPickBarProps) => {
  const items = picks || PROPERTY_TYPES.map(t => ({ value: t.value, label: t.label }));

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all',
          !selected
            ? 'bg-foreground text-background border-foreground shadow-sm'
            : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
        )}
      >
        All
      </button>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onSelect(selected === item.value ? undefined : item.value as PropertyType)}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5',
            selected === item.value
              ? 'bg-foreground text-background border-foreground shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default QuickPickBar;
