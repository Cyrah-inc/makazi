import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PropertyPurpose } from '@/types/property';
import LocationFilterBar, { LocationFilterBarProps } from '@/components/LocationFilterBar';

interface ListingHeroProps {
  purpose: PropertyPurpose;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onSearch: (query: string) => void;
  defaultSearch?: string;
  locationFilterProps?: Omit<LocationFilterBarProps, 'purpose'>;
}

const purposeStyles: Record<PropertyPurpose, { gradient: string; accent: string; ring: string }> = {
  buy: {
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    accent: 'bg-primary/10 text-primary',
    ring: 'ring-primary/20',
  },
  rent: {
    gradient: 'from-rent/15 via-rent/5 to-transparent',
    accent: 'bg-rent/10 text-rent',
    ring: 'ring-rent/20',
  },
  airbnb: {
    gradient: 'from-airbnb/15 via-airbnb/5 to-transparent',
    accent: 'bg-airbnb/10 text-airbnb',
    ring: 'ring-airbnb/20',
  },
};

const ListingHero = ({ purpose, title, subtitle, icon, onSearch, defaultSearch, locationFilterProps }: ListingHeroProps) => {
  const styles = purposeStyles[purpose];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSearch(formData.get('search') as string);
  };

  return (
    <section className={cn('relative overflow-hidden border-b border-border')}>
      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', styles.gradient)} />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-background to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative py-6 md:py-8 space-y-4">
        {/* Row 1: Title + Search */}
        <div className="flex items-center gap-3">
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', styles.accent)}>
            {icon}
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="relative max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by location, name, or type..."
            defaultValue={defaultSearch || ''}
            className={cn('pl-10 h-11 bg-card/80 backdrop-blur-sm border-border shadow-sm ring-1', styles.ring)}
          />
        </form>

        {/* Row 2: Location Quick Actions */}
        {locationFilterProps && (
          <LocationFilterBar purpose={purpose} {...locationFilterProps} />
        )}
      </div>
    </section>
  );
};

export default ListingHero;
