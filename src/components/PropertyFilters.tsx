import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PropertyFilter, PropertyPurpose, KENYA_COUNTIES, PROPERTY_TYPES, AMENITIES } from '@/types/property';
import { formatPrice } from '@/lib/formatters';
import { getTowns } from '@/data/mockProperties';
import { X } from 'lucide-react';

interface PropertyFiltersProps {
  filters: PropertyFilter;
  onChange: (filters: PropertyFilter) => void;
  purpose: PropertyPurpose;
}

const PropertyFilters = ({ filters, onChange, purpose }: PropertyFiltersProps) => {
  const updateFilter = <K extends keyof PropertyFilter>(key: K, value: PropertyFilter[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({ purpose: filters.purpose });
  };

  const getPriceRange = () => {
    switch (purpose) {
      case 'buy':
        return { min: 0, max: 100000000, step: 1000000 };
      case 'rent':
        return { min: 0, max: 500000, step: 10000 };
      case 'airbnb':
        return { min: 0, max: 50000, step: 1000 };
    }
  };

  const priceRange = getPriceRange();
  const towns = filters.county ? getTowns(filters.county) : [];

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'purpose' && filters[key as keyof PropertyFilter] !== undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* County */}
      <div className="space-y-2">
        <label className="text-sm font-medium">County</label>
        <Select 
          value={filters.county || ''} 
          onValueChange={(v) => updateFilter('county', v || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Counties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Counties</SelectItem>
            {KENYA_COUNTIES.map((county) => (
              <SelectItem key={county} value={county}>{county}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Town */}
      {towns.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Town / Area</label>
          <Select 
            value={filters.town || ''} 
            onValueChange={(v) => updateFilter('town', v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Areas</SelectItem>
              {towns.map((town) => (
                <SelectItem key={town} value={town}>{town}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Property Type</label>
        <Select 
          value={filters.propertyType || ''} 
          onValueChange={(v) => updateFilter('propertyType', v as any || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Price Range</label>
          <span className="text-xs text-muted-foreground">
            {filters.minPrice || filters.maxPrice 
              ? `${formatPrice(filters.minPrice || 0)} - ${formatPrice(filters.maxPrice || priceRange.max)}`
              : 'Any'
            }
          </span>
        </div>
        <Slider
          value={[filters.minPrice || 0, filters.maxPrice || priceRange.max]}
          onValueChange={([min, max]) => {
            updateFilter('minPrice', min > 0 ? min : undefined);
            updateFilter('maxPrice', max < priceRange.max ? max : undefined);
          }}
          min={priceRange.min}
          max={priceRange.max}
          step={priceRange.step}
          className="py-2"
        />
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Bedrooms</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              variant={filters.bedrooms === num ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => updateFilter('bedrooms', filters.bedrooms === num ? undefined : num)}
            >
              {num}+
            </Button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Bathrooms</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
            <Button
              key={num}
              variant={filters.bathrooms === num ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => updateFilter('bathrooms', filters.bathrooms === num ? undefined : num)}
            >
              {num}+
            </Button>
          ))}
        </div>
      </div>

      {/* Furnished */}
      <div className="flex items-center gap-3">
        <Checkbox 
          id="furnished"
          checked={filters.furnished === true}
          onCheckedChange={(checked) => updateFilter('furnished', checked ? true : undefined)}
        />
        <label htmlFor="furnished" className="text-sm font-medium cursor-pointer">
          Furnished Only
        </label>
      </div>

      {/* Sort */}
      <div className="space-y-2 pt-4 border-t border-border">
        <label className="text-sm font-medium">Sort By</label>
        <Select 
          value={filters.sortBy || ''} 
          onValueChange={(v) => updateFilter('sortBy', v as any || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Recommended" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Recommended</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PropertyFilters;
