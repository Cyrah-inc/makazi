import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Check, 
  X, 
  Heart,
  Eye,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

interface PropertyPreviewModalProps {
  property: {
    id: string;
    title: string;
    description: string | null;
    address: string;
    city: string;
    state: string | null;
    country: string;
    price: number;
    property_type: 'sale' | 'rent' | 'airbnb';
    bedrooms: number;
    bathrooms: number;
    area_sqft: number | null;
    images: string[];
    amenities?: string[];
    views_count: number;
    created_at: string;
    landlord_name?: string | null;
    landlord_email?: string | null;
    favorites_count?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

export function PropertyPreviewModal({
  property,
  open,
  onOpenChange,
  onApprove,
  onReject,
  showActions = true,
}: PropertyPreviewModalProps) {
  if (!property) return null;

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(price);
    
    if (type === 'rent') return `${formatted}/mo`;
    if (type === 'airbnb') return `${formatted}/night`;
    return formatted;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rent': return 'For Rent';
      case 'airbnb': return 'Airbnb';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-heading">Property Preview</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Images */}
            {property.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <img
                    src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.PREVIEW.width, IMAGE_SIZES.PREVIEW.quality)}
                    alt={property.title}
                    loading="lazy"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                {property.images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={getOptimizedImageUrl(img, IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)}
                    alt={`${property.title} ${idx + 2}`}
                    loading="lazy"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
                {property.images.length > 5 && (
                  <div className="relative">
                    <img
                      src={getOptimizedImageUrl(property.images[5], IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)}
                      alt={`${property.title} 6`}
                      loading="lazy"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white font-semibold">
                      +{property.images.length - 5} more
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            {/* Title and Price */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  {property.title}
                </h2>
                <Badge variant="secondary" className="shrink-0">
                  {getTypeLabel(property.property_type)}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(property.price, property.property_type)}
              </p>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{property.address}, {property.city}{property.state ? `, ${property.state}` : ''}, {property.country}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Bed className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-semibold">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Bath className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-semibold">{property.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Maximize className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-semibold">{property.area_sqft?.toLocaleString() || 'N/A'} sqft</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Eye className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="font-semibold">{property.views_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Favorites count */}
            {property.favorites_count !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
                <Heart className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Saved by users</p>
                  <p className="font-semibold">{property.favorites_count} {property.favorites_count === 1 ? 'user' : 'users'}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="outline">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Landlord Info */}
            {(property.landlord_name || property.landlord_email) && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{property.landlord_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{property.landlord_email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Listing date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Listed on {format(new Date(property.created_at), 'MMMM d, yyyy')}</span>
            </div>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        {showActions && onApprove && onReject && (
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              onClick={() => {
                onReject(property.id);
                onOpenChange(false);
              }}
              className="text-destructive hover:text-destructive gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={() => {
                onApprove(property.id);
                onOpenChange(false);
              }}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Approve
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}