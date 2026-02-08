import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const locations = [
  {
    name: 'Nairobi',
    county: 'Nairobi',
    properties: 1250,
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600',
    featured: true,
  },
  {
    name: 'Mombasa',
    county: 'Mombasa',
    properties: 420,
    image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600',
    featured: true,
  },
  {
    name: 'Diani Beach',
    county: 'Kwale',
    properties: 180,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    featured: false,
  },
  {
    name: 'Nakuru',
    county: 'Nakuru',
    properties: 320,
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600',
    featured: false,
  },
  {
    name: 'Kisumu',
    county: 'Kisumu',
    properties: 210,
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
    featured: false,
  },
  {
    name: 'Naivasha',
    county: 'Nakuru',
    properties: 95,
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600',
    featured: false,
  },
];

const LocationsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Popular Locations
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore properties in Kenya's most sought-after areas
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            View All Locations
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {locations.map((location, index) => (
            <Link
              key={location.name}
              to={`/buy?county=${location.county}`}
              className={`group relative rounded-2xl overflow-hidden animate-fade-in-up opacity-0 ${
                location.featured ? 'col-span-2 row-span-2' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className={`relative ${location.featured ? 'aspect-square' : 'aspect-[3/4]'}`}>
                <img
                  src={location.image}
                  alt={location.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-1.5 text-primary-foreground/80 text-sm mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{location.county}</span>
                  </div>
                  <h3 className="font-heading font-bold text-primary-foreground text-lg md:text-xl">
                    {location.name}
                  </h3>
                  <p className="text-primary-foreground/70 text-sm">
                    {location.properties}+ properties
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
