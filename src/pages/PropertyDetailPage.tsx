import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineChatInput } from '@/components/chat/InlineChatInput';
import { WhatsAppButton } from '@/components/chat/WhatsAppButton';
import { PropertyMap } from '@/components/PropertyMap';
import { BookingDialog } from '@/components/booking/BookingDialog';
import { RentalBookingDialog } from '@/components/booking/RentalBookingDialog';
import { LazySection } from '@/components/LazySection';
import { formatFullPrice, formatRelativeDate } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  MapPin, Bed, Bath, Car, Maximize, Heart, Share2, Phone, 
  Calendar, ChevronLeft, ChevronRight, Star,
  Shield, Eye, Home, CheckCircle2, BadgeCheck
} from 'lucide-react';
import { PropertyDetailSkeleton } from '@/components/skeletons/PropertyDetailSkeleton';
import MortgageCalculator from '@/components/MortgageCalculator';
import { PropertyReviewsSection, PropertyReviewsSummary } from '@/components/PropertyReviews';
import { SaleDocumentsCard } from '@/components/SaleDocumentsCard';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, IMAGE_SIZES } from '@/lib/imageUtils';

import { addRecentlyViewed } from '@/hooks/useRecentlyViewed';

const ImageLightbox = lazy(() => import('@/components/ImageLightbox'));
const SimilarProperties = lazy(() => import('@/components/SimilarProperties'));

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.quicktime'];
const isVideoUrl = (url: string) => VIDEO_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { user } = useAuth();

  // Track recently viewed and log property view
  useEffect(() => {
    if (id) {
      addRecentlyViewed(id);
      // Log view to property_view_logs for analytics
      supabase.from('property_view_logs').insert({
        property_id: id,
        viewer_id: user?.id || null,
      }).then(() => {});
    }
  }, [id, user?.id]);

  const captureLeadFn = (leadType: 'whatsapp' | 'chat') => {
    if (!dbProperty) return;
    supabase.from('leads').insert({
      user_id: user?.id || null,
      property_id: dbProperty.id,
      landlord_id: dbProperty.landlord_id,
      lead_type: leadType,
    }).then(() => {});
  };

  // Fetch from Supabase
  const { data: dbProperty, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id,title,description,address,city,state,country,price,sale_price,monthly_rent,nightly_rate,property_type,property_category,bedrooms,bathrooms,area_sqft,images,amenities,views_count,landlord_id,latitude,longitude,created_at,updated_at,status,rental_units,sale_documents')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch landlord profile (name, avatar)
  const { data: landlordProfile } = useQuery({
    queryKey: ['landlord-profile-public', dbProperty?.landlord_id],
    queryFn: async () => {
      const landlordId = dbProperty!.landlord_id;
      const [profilesRes, { data: verification }] = await Promise.all([
        supabase.rpc('get_public_profiles', { user_ids: [landlordId] }) as unknown as { data: { user_id: string; full_name: string; avatar_url: string; email: string }[] | null },
        supabase.from('landlord_public_info').select('verification_status').eq('user_id', landlordId).maybeSingle(),
      ]);
      const profile = profilesRes.data?.[0] || null;
      return {
        name: profile?.full_name || 'Property Owner',
        avatar: profile?.avatar_url || null,
        verified: verification?.verification_status === 'verified',
      };
    },
    enabled: !!dbProperty?.landlord_id,
  });

  // Fetch landlord phone from safe public view
  const { data: landlordPhone } = useQuery({
    queryKey: ['landlord-phone', dbProperty?.landlord_id],
    queryFn: async () => {
      const landlordId = dbProperty!.landlord_id;
      const { data: lp } = await supabase
        .from('landlord_public_info')
        .select('business_phone')
        .eq('user_id', landlordId)
        .maybeSingle();
      if (lp?.business_phone) return lp.business_phone;
      const { data: p } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', landlordId)
        .maybeSingle();
      return p?.phone || null;
    },
    enabled: !!dbProperty?.landlord_id,
  });

  // Check if landlord has active subscription (gates WhatsApp visibility)
  const { data: hasActiveSubscription } = useQuery({
    queryKey: ['landlord-subscription', dbProperty?.landlord_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', dbProperty!.landlord_id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();
      return !!data;
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
    verified: landlordProfile?.verified ?? true,
    propertyType: dbProperty.property_category || 'apartment',
    yearBuilt: undefined,
    furnished: false,
    landlordId: dbProperty.landlord_id,
    landlordName: landlordProfile?.name || 'Property Owner',
    landlordAvatar: landlordProfile?.avatar || null,
    landlordVerified: landlordProfile?.verified ?? false,
    latitude: dbProperty.latitude ? Number(dbProperty.latitude) : undefined,
    longitude: dbProperty.longitude ? Number(dbProperty.longitude) : undefined,
    rentalUnits: Array.isArray((dbProperty as any).rental_units) ? (dbProperty as any).rental_units : undefined,
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
            <Link to="/"><Button>Go Home</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);

  const currentMedia = property.images[currentImageIndex];
  const currentIsVideo = isVideoUrl(currentMedia);

  const whatsAppUrl = landlordPhone
    ? `https://wa.me/${landlordPhone.replace(/[\s\-()]/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hi, I'm interested in "${property.title}" listed on Makazi. Is it still available?`)}`
    : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Image Gallery */}
        <section className="relative bg-foreground">
          <div className="container py-4">
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
              {currentIsVideo ? (
                <video
                  src={currentMedia}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={getOptimizedImageUrl(currentMedia, IMAGE_SIZES.DETAIL.width, IMAGE_SIZES.DETAIL.quality)}
                  alt={property.title}
                  loading="lazy"
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                />
              )}
              
              {/* Navigation */}
              {property.images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={prevImage}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={nextImage}>
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
                <Button variant="ghost" size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => setIsFavorited(!isFavorited)}>
                  <Heart className={cn("h-5 w-5", isFavorited && "fill-airbnb text-airbnb")} />
                </Button>
                <Button variant="ghost" size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {property.images.map((img, index) => {
                  const thumbIsVideo = isVideoUrl(img);
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                        index === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      {thumbIsVideo ? (
                        <video src={img} preload="metadata" muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={getOptimizedImageUrl(img, IMAGE_SIZES.DETAIL_THUMB.width, IMAGE_SIZES.DETAIL_THUMB.quality)} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </button>
                  );
                })}
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
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>

                {/* Rental Units Breakdown */}
                {property.rentalUnits && property.rentalUnits.length > 0 && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold mb-4">Available Units</h2>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                        <span>Unit Type</span>
                        <span className="text-center">Available</span>
                        <span className="text-right">Rent/month</span>
                      </div>
                      {property.rentalUnits.map((unit: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-3 gap-4 p-3 border-t border-border text-sm">
                          <span className="font-medium">{unit.type}</span>
                          <span className="text-center">{unit.count} unit{unit.count !== 1 ? 's' : ''}</span>
                          <span className="text-right font-semibold text-primary">{formatFullPrice(unit.rent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Reviews */}
                <PropertyReviewsSection propertyId={property.id} />

                {/* Location Map */}
                {property.latitude && property.longitude && (
                  <LazySection rootMargin="300px" minHeight="400px">
                    <div>
                      <h2 className="font-heading text-xl font-semibold mb-4">Location</h2>
                      <div className="w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0">
                        <PropertyMap
                          latitude={property.latitude}
                          longitude={property.longitude}
                          title={property.title}
                          address={property.address}
                          height="clamp(400px, 85vw, 600px)"
                          showDirections
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {property.address}
                      </p>
                    </div>
                  </LazySection>
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
                          {property.rentalUnits && property.rentalUnits.length > 1 ? (
                            <div className="space-y-1">
                              {property.rentalUnits.map((unit: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{unit.type} ({unit.count} units)</span>
                                  <span className="font-semibold">{formatFullPrice(unit.rent)}/mo</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-3xl font-heading font-bold text-rent">
                              {formatFullPrice(property.monthlyRent)}
                              <span className="text-base font-normal text-muted-foreground">/month</span>
                            </div>
                          )}
                        </div>
                      )}
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
                            onLeadCapture={() => captureLeadFn('chat')}
                          />
                        )}
                        {hasActiveSubscription && landlordPhone && (
                          <WhatsAppButton
                            phone={landlordPhone}
                            propertyTitle={property.title}
                            onLeadCapture={() => captureLeadFn('whatsapp')}
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
                              Book Stay
                            </Button>
                          </BookingDialog>
                        )}
                        {property.purposes.includes('rent') && property.monthlyRent && (
                          <RentalBookingDialog
                            propertyId={property.id}
                            landlordId={property.landlordId}
                            monthlyRent={property.monthlyRent}
                            propertyTitle={property.title}
                          >
                            <Button variant="default" size="lg" className="w-full gap-2">
                              <Calendar className="h-5 w-5" />
                              Reserve Now
                            </Button>
                          </RentalBookingDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mortgage Calculator for buy properties */}
                  {property.purposes.includes('buy') && property.salePrice && (
                    <MortgageCalculator salePrice={property.salePrice} />
                  )}

                  {/* Sale Verification Documents */}
                  {dbProperty && dbProperty.property_type === 'sale' && (dbProperty as any).sale_documents?.length > 0 && (
                    <SaleDocumentsCard
                      propertyId={dbProperty.id}
                      saleDocuments={(dbProperty as any).sale_documents}
                    />
                  )}

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={property.landlordAvatar || undefined} alt={property.landlordName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {property.landlordName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-heading font-semibold flex items-center gap-1.5">
                            {property.landlordName}
                            {property.landlordVerified && (
                              <BadgeCheck className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property.landlordVerified ? 'Verified Property Owner' : 'Property Owner'}
                          </div>
                          {hasActiveSubscription && landlordPhone && (
                            <a
                              href={`tel:${landlordPhone}`}
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {landlordPhone}
                            </a>
                          )}
                        </div>
                      </div>
                      <PropertyReviewsSummary propertyId={property.id} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating mobile WhatsApp button */}
      {hasActiveSubscription && landlordPhone && (
        <a
          href={whatsAppUrl}
          target="_top"
          rel="noopener noreferrer"
          onClick={(e) => { captureLeadFn('whatsapp'); const w = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer'); if (w) e.preventDefault(); }}
          className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1da851] transition-colors"
          aria-label="Chat on WhatsApp"
        >
          <Phone className="h-6 w-6" />
        </a>
      )}

      {dbProperty && (
        <SimilarProperties
          propertyId={dbProperty.id}
          propertyType={dbProperty.property_type}
          state={dbProperty.state}
        />
      )}

      <Footer />

      {/* Image Lightbox */}
      <Suspense fallback={null}>
        <ImageLightbox
          images={property?.images.filter(img => !isVideoUrl(img)) || []}
          initialIndex={currentImageIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default PropertyDetailPage;
