import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PropertyPurpose } from '@/types/property';

interface ListingHeroProps {
  purpose: PropertyPurpose;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stats: { label: string; value: string }[];
  onSearch: (query: string) => void;
  defaultSearch?: string;
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

const ListingHero = ({ purpose, title, subtitle, icon, stats, onSearch, defaultSearch }: ListingHeroProps) => {
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

      <div className="container relative py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Left: Title + Search */}
          <div className="space-y-4 max-w-xl">
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
            <form onSubmit={handleSubmit} className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search by location, name, or type..."
                defaultValue={defaultSearch || ''}
                className={cn('pl-10 h-11 bg-card/80 backdrop-blur-sm border-border shadow-sm ring-1', styles.ring)}
              />
            </form>
          </div>

          {/* Right: Stats */}
          <div className="flex gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-right">
                <p className="font-heading text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingHero;
