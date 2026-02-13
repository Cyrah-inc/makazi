import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InlineChatInput } from '@/components/chat/InlineChatInput';
import { WhatsAppButton } from '@/components/chat/WhatsAppButton';
import { PropertyMap } from '@/components/PropertyMap';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { formatFullPrice, formatRelativeDate } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Bed, Bath, Car, Maximize, Heart, Share2, Phone, 
  Calendar, ChevronLeft, ChevronRight, Star,
  Shield, Eye, Home, CheckCircle2
} from 'lucide-react';
import { PropertyDetailSkeleton } from '@/components/skeletons/PropertyDetailSkeleton';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch from Supabase
  const { data: dbProperty, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id,title,description,address,city,state,country,price,sale_price,monthly_rent,nightly_rate,property_type,property_category,bedrooms,bathrooms,area_sqft,images,amenities,views_count,landlord_id,latitude,longitude,created_at,updated_at,status')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch landlord phone for WhatsApp
  const { data: landlordPhone } = useQuery({
    queryKey: ['landlord-phone', dbProperty?.landlord_id],
    queryFn: async () => {
      const landlordId = dbProperty!.landlord_id;
      // Try landlord_profiles.business_phone first
      const { data: lp } = await supabase
        .from('landlord_profiles')
        .select('business_phone')
        .eq('user_id', landlordId)
        .maybeSingle();
      if (lp?.business_phone) return lp.business_phone;
      // Fallback to profiles.phone
      const { data: p } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', landlordId)
        .maybeSingle();
      return p?.phone || null;
    },
    enabled: !!dbProperty?.landlord_id,
  });

  // Transform DB property to display format
  const property = dbProperty ? {
    id: dbProperty.id,
    title: dbProperty.title,
    description: dbProperty.description || '',
    address: `${dbProperty.address}, ${dbProperty.city}`,
    county: dbProperty.state || '',
    town: dbProperty.city,
    images: dbProperty.images && dbProperty.images.length > 0 ? dbProperty.images : ['/placeholder.svg'],
    bedrooms: dbProperty.bedrooms,
    bathrooms: dbProperty.bathrooms,
    parkingSpaces: 0,
    size: dbProperty.area_sqft || 0,
    purposes: [dbProperty.property_type === 'sale' ? 'buy' : dbProperty.property_type] as ('buy' | 'rent' | 'airbnb')[],
    salePrice: dbProperty.sale_price || (dbProperty.property_type === 'sale' ? dbProperty.price : undefined),
    monthlyRent: dbProperty.monthly_rent || (dbProperty.property_type === 'rent' ? dbProperty.price : undefined),
    nightlyRate: dbProperty.nightly_rate || (dbProperty.property_type === 'airbnb' ? dbProperty.price : undefined),
    amenities: dbProperty.amenities || [],
    views: dbProperty.views_count,
    createdAt: dbProperty.created_at,
    verified: true,
    propertyType: dbProperty.property_category || 'apartment',
    yearBuilt: undefined,
    furnished: false,
    landlordId: dbProperty.landlord_id,
    landlordName: 'Property Owner',
    latitude: dbProperty.latitude ? Number(dbProperty.latitude) : undefined,
    longitude: dbProperty.longitude ? Number(dbProperty.longitude) : undefined,
  } : null;

  if (isLoading) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold mb-2">Property Not Found</h1>
            <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Image Gallery */}
        <section className="relative bg-foreground">
          <div className="container py-4">
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
              <img
                src={getOptimizedImageUrl(property.images[currentImageIndex], IMAGE_SIZES.DETAIL.width, IMAGE_SIZES.DETAIL.quality)}
                alt={property.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              
              {/* Navigation */}
              {property.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium">
                {currentImageIndex + 1} / {property.images.length}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => setIsFavorited(!isFavorited)}
                >
                  <Heart className={cn("h-5 w-5", isFavorited && "fill-airbnb text-airbnb")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {property.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                      index === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={getOptimizedImageUrl(img, IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {property.purposes.map((p) => (
                      <Badge key={p} variant={p}>
                        {p === 'buy' ? 'For Sale' : p === 'rent' ? 'For Rent' : 'Airbnb'}
                      </Badge>
                    ))}
                    {property.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {property.title}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {property.views.toLocaleString()} views
                    </span>
                    <span>Listed {formatRelativeDate(property.createdAt)}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Bed, value: property.bedrooms, label: 'Bedrooms' },
                    { icon: Bath, value: property.bathrooms, label: 'Bathrooms' },
                    { icon: Car, value: property.parkingSpaces, label: 'Parking' },
                    { icon: Maximize, value: `${property.size} m²`, label: 'Area' },
                  ].map((feature) => (
                    <Card key={feature.label}>
                      <CardContent className="p-4 text-center">
                        <feature.icon className="h-5 w-5 mx-auto text-primary mb-2" />
                        <div className="font-heading font-bold text-lg">{feature.value}</div>
                        <div className="text-xs text-muted-foreground">{feature.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Property Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Property Type', value: property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) },
                      { label: 'Year Built', value: property.yearBuilt || 'N/A' },
                      { label: 'Furnished', value: property.furnished ? 'Yes' : 'No' },
                      { label: 'County', value: property.county },
                      { label: 'Town', value: property.town },
                      { label: 'Size', value: `${property.size} m²` },
                    ].map((detail) => (
                      <div key={detail.label} className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">{detail.label}</span>
                        <span className="font-medium">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Map */}
                {property.latitude && property.longitude && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold mb-4">Location</h2>
                    <PropertyMap
                      latitude={property.latitude}
                      longitude={property.longitude}
                      title={property.title}
                      address={property.address}
                      height="350px"
                    />
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Price Card */}
                  <Card className="shadow-lg">
                    <CardContent className="p-6">
                      {property.salePrice && (
                        <div className="mb-4">
                          <div className="text-sm text-muted-foreground mb-1">Sale Price</div>
                          <div className="text-3xl font-heading font-bold text-primary">
                            {formatFullPrice(property.salePrice)}
                          </div>
                        </div>
                      )}
                      
                      {property.monthlyRent && (
                        <div className="mb-4">
                          <div className="text-sm text-muted-foreground mb-1">Monthly Rent</div>
                          <div className="text-3xl font-heading font-bold text-rent">
                            {formatFullPrice(property.monthlyRent)}
                            <span className="text-base font-normal text-muted-foreground">/month</span>
                          </div>
                        </div>
                      )}
                      
                      {property.nightlyRate && (
                        <div className="mb-4">
                          <div className="text-sm text-muted-foreground mb-1">Nightly Rate</div>
                          <div className="text-3xl font-heading font-bold text-airbnb">
                            {formatFullPrice(property.nightlyRate)}
                            <span className="text-base font-normal text-muted-foreground">/night</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {property.landlordId && (
                          <InlineChatInput
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            propertyTitle={property.title}
                          />
                        )}
                        {landlordPhone && (
                          <WhatsAppButton
                            phone={landlordPhone}
                            propertyTitle={property.title}
                          />
                        )}
                        {property.purposes.includes('airbnb') && property.nightlyRate && (
                          <BookingDialog
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            nightlyRate={property.nightlyRate}
                            propertyTitle={property.title}
                          >
                            <Button variant="accent" size="lg" className="w-full gap-2">
                              <Calendar className="h-5 w-5" />
                              Book Now
                            </Button>
                          </BookingDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Agent Card */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Home className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-heading font-semibold">{property.landlordName}</div>
                          <div className="text-sm text-muted-foreground">Property Owner</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="font-medium text-foreground">4.8</span>
                        <span>(24 reviews)</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetailPage;
