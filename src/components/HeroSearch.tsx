import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Home } from 'lucide-react';
import { KENYA_COUNTIES, PropertyPurpose } from '@/types/property';

interface HeroSearchProps {
  onSearch?: (filters: { search: string; county: string; purpose: PropertyPurpose }) => void;
}

const HeroSearch = ({ onSearch }: HeroSearchProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [county, setCounty] = useState('');
  const [purpose, setPurpose] = useState<PropertyPurpose>('buy');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (county) params.set('county', county);
    params.set('purpose', purpose);
    
    navigate(`/${purpose}?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Purpose Tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-1.5">
          {[
            { value: 'buy' as const, label: 'Buy' },
            { value: 'rent' as const, label: 'Rent' },
            { value: 'airbnb' as const, label: 'Airbnb' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPurpose(tab.value)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                purpose === tab.value
                  ? 'bg-primary-foreground text-primary shadow-md'
                  : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card rounded-2xl shadow-xl p-2 md:p-3">
        <div className="flex flex-col md:flex-row gap-2 md:gap-0">
          {/* Search Input */}
          <div className="flex-1 flex items-center gap-3 px-4 py-2 md:border-r border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search by location, property name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* County Select */}
          <div className="flex items-center gap-3 px-4 py-2 md:border-r border-border md:min-w-[200px]">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 focus:ring-offset-0 [&>span]:text-foreground">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {KENYA_COUNTIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="flex items-center gap-3 px-4 py-2 md:min-w-[180px]">
            <Home className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select defaultValue="all">
              <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <Button 
            variant="hero" 
            size="lg" 
            className="md:ml-2 rounded-xl"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
            <span className="md:hidden lg:inline">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSearch;
