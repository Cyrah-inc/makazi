import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { formatFullPrice } from '@/lib/formatters';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';
import { Link } from 'react-router-dom';

interface ChatPropertyCardProps {
  property: {
    id: string;
    title: string;
    images: string[] | null;
    price: number;
    property_type: string;
    city: string;
  };
}

export function ChatPropertyCard({ property }: ChatPropertyCardProps) {
  return (
    <Link to={`/property/${property.id}`}>
      <Card className="bg-muted/50 hover:bg-muted transition-colors">
        <CardContent className="p-3 flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img
              src={getOptimizedImageUrl(property.images?.[0] || '/placeholder.svg', IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{property.title}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {property.city}
            </p>
            <p className="text-sm font-semibold text-primary mt-1">
              {formatFullPrice(property.price)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
