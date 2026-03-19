import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Bed, Bath, Maximize, Check, X, Heart, Eye, Calendar, User,
  Building2, FileText, Download, Loader2, Shield, MapPinned, Layers, DollarSign
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
    sale_price?: number | null;
    monthly_rent?: number | null;
    nightly_rate?: number | null;
    property_type: 'sale' | 'rent' | 'airbnb';
    property_category?: string | null;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number | null;
    latitude?: number | null;
    longitude?: number | null;
    images: string[];
    amenities?: string[];
    rental_units?: any;
    sale_documents?: string[];
    views_count: number;
    created_at: string;
    landlord_id?: string;
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

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.quicktime'];
const isVideoUrl = (url: string) => VIDEO_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));

const DOC_LABELS = ['Title Deed', 'Land Search Certificate', 'Additional Document', 'Additional Document', 'Additional Document'];

export function PropertyPreviewModal({
  property,
  open,
  onOpenChange,
  onApprove,
  onReject,
  showActions = true,
}: PropertyPreviewModalProps) {
  const [docSignedUrls, setDocSignedUrls] = useState<Record<number, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [landlordVerification, setLandlordVerification] = useState<string | null>(null);

  useEffect(() => {
    if (!property || !open) return;
    
    // Load sale document signed URLs
    if (property.sale_documents && property.sale_documents.length > 0) {
      setLoadingDocs(true);
      Promise.all(
        property.sale_documents.map((path, idx) =>
          supabase.storage.from('landlord-documents').createSignedUrl(path, 3600)
            .then(({ data }) => ({ idx, url: data?.signedUrl || null }))
        )
      ).then(results => {
        const urls: Record<number, string> = {};
        results.forEach(r => { if (r.url) urls[r.idx] = r.url; });
        setDocSignedUrls(urls);
        setLoadingDocs(false);
      });
    }

    // Load landlord verification status
    if (property.landlord_id) {
      supabase.from('landlord_public_info')
        .select('verification_status')
        .eq('user_id', property.landlord_id)
        .maybeSingle()
        .then(({ data }) => setLandlordVerification(data?.verification_status || null));
    }
  }, [property, open]);

  if (!property) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rent': return 'For Rent';
      case 'airbnb': return 'Airbnb';
      default: return type;
    }
  };

  const rentalUnits = Array.isArray(property.rental_units) ? property.rental_units : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-heading">Property Details — Admin Review</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(95vh-120px)]">
          <div className="p-6 pt-4">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left column - Images & Description */}
              <div className="lg:col-span-3 space-y-6">
                {/* Images grid - show ALL */}
                {property.images.length > 0 ? (
                  <div className="space-y-2">
                    {/* Main image */}
                    {isVideoUrl(property.images[0]) ? (
                      <video src={property.images[0]} controls preload="metadata" className="w-full h-64 object-cover rounded-lg" />
                    ) : (
                      <img
                        src={getOptimizedImageUrl(property.images[0], IMAGE_SIZES.PREVIEW.width, IMAGE_SIZES.PREVIEW.quality)}
                        alt={property.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    {/* All remaining images */}
                    {property.images.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {property.images.slice(1).map((img, idx) => (
                          isVideoUrl(img) ? (
                            <video key={idx} src={img} controls preload="metadata" className="w-full h-24 object-cover rounded-lg" />
                          ) : (
                            <img
                              key={idx}
                              src={getOptimizedImageUrl(img, IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)}
                              alt={`${property.title} ${idx + 2}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{property.images.length} media file(s)</p>
                  </div>
                ) : (
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                {/* Description */}
                {property.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {property.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rental Units */}
                {rentalUnits.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Rental Units
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 font-medium">Type</th>
                            <th className="text-left p-2 font-medium">Count</th>
                            <th className="text-left p-2 font-medium">Rent (KES)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rentalUnits.map((unit: any, idx: number) => (
                            <tr key={idx} className="border-t border-border">
                              <td className="p-2">{unit.type}</td>
                              <td className="p-2">{unit.count}</td>
                              <td className="p-2">{Number(unit.rent).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sale Verification Documents */}
                {property.sale_documents && property.sale_documents.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Sale Verification Documents
                    </h3>
                    <div className="space-y-2">
                      {loadingDocs ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading documents...
                        </div>
                      ) : (
                        property.sale_documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{DOC_LABELS[idx] || `Document ${idx + 1}`}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.split('/').pop()}</p>
                              </div>
                            </div>
                            {docSignedUrls[idx] ? (
                              <a href={docSignedUrls[idx]} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="gap-1.5">
                                  <Download className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              </a>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column - Details & Stats */}
              <div className="lg:col-span-2 space-y-5">
                {/* Title & Badges */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge variant="secondary">{getTypeLabel(property.property_type)}</Badge>
                    {property.property_category && (
                      <Badge variant="outline" className="capitalize">{property.property_category}</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-heading font-bold text-foreground">{property.title}</h2>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{property.address}, {property.city}{property.state ? `, ${property.state}` : ''}, {property.country}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-primary" /> Pricing
                  </h4>
                  <div className="text-lg font-bold text-primary">{formatPrice(property.price)}</div>
                  {property.sale_price && (
                    <div className="text-sm"><span className="text-muted-foreground">Sale:</span> {formatPrice(property.sale_price)}</div>
                  )}
                  {property.monthly_rent && (
                    <div className="text-sm"><span className="text-muted-foreground">Rent:</span> {formatPrice(property.monthly_rent)}/mo</div>
                  )}
                  {property.nightly_rate && (
                    <div className="text-sm"><span className="text-muted-foreground">Nightly:</span> {formatPrice(property.nightly_rate)}/night</div>
                  )}
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Bed className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Beds</p>
                      <p className="font-semibold text-sm">{property.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Bath className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Baths</p>
                      <p className="font-semibold text-sm">{property.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Maximize className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Area</p>
                      <p className="font-semibold text-sm">{property.area_sqft?.toLocaleString() || 'N/A'} sqft</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Eye className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-semibold text-sm">{property.views_count.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Favorites */}
                {property.favorites_count !== undefined && property.favorites_count > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm">{property.favorites_count} {property.favorites_count === 1 ? 'save' : 'saves'}</span>
                  </div>
                )}

                {/* Location Coordinates */}
                {(property.latitude || property.longitude) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPinned className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Coordinates</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {Number(property.latitude).toFixed(6)}, {Number(property.longitude).toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Landlord Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{property.landlord_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{property.landlord_email}</p>
                      {landlordVerification && (
                        <Badge variant={landlordVerification === 'verified' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {landlordVerification === 'verified' ? '✓ Verified' : landlordVerification}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Listing date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Listed {format(new Date(property.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        {showActions && onApprove && onReject && (
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              onClick={() => { onReject(property.id); onOpenChange(false); }}
              className="text-destructive hover:text-destructive gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={() => { onApprove(property.id); onOpenChange(false); }}
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
