import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Home, Building, Landmark, Trees, Briefcase, Plus, Trash2, Sparkles, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { PropertyImageUpload } from '@/components/PropertyImageUpload';
import { LocationPicker } from '@/components/LocationPicker';
import { KENYA_COUNTIES } from '@/types/property';
import { useLandlordProfile } from '@/hooks/useLandlordProfile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const amenitiesList = [
  'Parking', 'Swimming Pool', 'Gym', 'Security', 'Garden',
  'Balcony', 'Air Conditioning', 'Furnished', 'WiFi', 'Laundry',
  'CCTV', 'Borehole', 'Generator', 'Solar Power', 'Pet Friendly', 'Servant Quarters'
];

const propertyCategories = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'villa', label: 'Villa', icon: Home },
  { value: 'mansion', label: 'Mansion', icon: Landmark },
  { value: 'maisonette', label: 'Maisonette', icon: Home },
  { value: 'bungalow', label: 'Bungalow', icon: Home },
  { value: 'townhouse', label: 'Townhouse', icon: Building },
  { value: 'land', label: 'Land', icon: Trees },
  { value: 'commercial', label: 'Commercial', icon: Building },
  { value: 'office', label: 'Office Space', icon: Briefcase },
];

const UNIT_TYPE_OPTIONS = [
  'Bedsitter', 'Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', 'Office Space', 'Shop', 'Other'
];

interface RentalUnitEntry {
  type: string;
  count: string;
  rent: string;
}

type ListingPurpose = 'sale' | 'rent' | 'airbnb';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'luxury'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const { hasActiveSubscription } = useLandlordProfile();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_category: 'apartment',
    // Listing purposes
    forSale: false,
    forRent: false,
    forAirbnb: false,
    // Individual prices
    salePrice: '',
    monthlyRent: '',
    nightlyRate: '',
    // Details
    bedrooms: '1',
    bathrooms: '1',
    area_sqft: '',
    // Location
    address: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    // Features
    amenities: [] as string[],
    images: [] as string[],
  });

  const [isMultiUnit, setIsMultiUnit] = useState(false);
  const [rentalUnits, setRentalUnits] = useState<RentalUnitEntry[]>([
    { type: 'Bedsitter', count: '', rent: '' }
  ]);

  const addRentalUnit = () => {
    setRentalUnits(prev => [...prev, { type: '1 Bedroom', count: '', rent: '' }]);
  };

  const removeRentalUnit = (index: number) => {
    setRentalUnits(prev => prev.filter((_, i) => i !== index));
  };

  const updateRentalUnit = (index: number, field: keyof RentalUnitEntry, value: string) => {
    setRentalUnits(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u));
  };

  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('landlord_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  useEffect(() => {
    if (property) {
      const hasSalePrice = !!property.sale_price;
      const hasMonthlyRent = !!property.monthly_rent;
      const hasNightlyRate = !!property.nightly_rate;

      const forSale = hasSalePrice || property.property_type === 'sale';
      const forRent = hasMonthlyRent || property.property_type === 'rent';
      const forAirbnb = hasNightlyRate || property.property_type === 'airbnb';

      // Load rental units from DB
      const dbRentalUnits = property.rental_units as any;
      if (Array.isArray(dbRentalUnits) && dbRentalUnits.length > 0) {
        setIsMultiUnit(true);
        setRentalUnits(dbRentalUnits.map((u: any) => ({
          type: u.type || 'Bedsitter',
          count: u.count?.toString() || '',
          rent: u.rent?.toString() || '',
        })));
      }

      setFormData({
        title: property.title || '',
        description: property.description || '',
        property_category: property.property_category || 'apartment',
        forSale,
        forRent,
        forAirbnb,
        salePrice: property.sale_price?.toString() || (property.property_type === 'sale' ? property.price?.toString() : '') || '',
        monthlyRent: property.monthly_rent?.toString() || (property.property_type === 'rent' ? property.price?.toString() : '') || '',
        nightlyRate: property.nightly_rate?.toString() || (property.property_type === 'airbnb' ? property.price?.toString() : '') || '',
        bedrooms: property.bedrooms?.toString() || '1',
        bathrooms: property.bathrooms?.toString() || '1',
        area_sqft: property.area_sqft?.toString() || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        latitude: property.latitude ?? null,
        longitude: property.longitude ?? null,
        amenities: property.amenities || [],
        images: property.images || [],
      });
    }
  }, [property]);

  const showMultiUnitOption = formData.forRent && ['apartment', 'commercial', 'office'].includes(formData.property_category);

  const getSelectedPurposes = (): ListingPurpose[] => {
    const purposes: ListingPurpose[] = [];
    if (formData.forSale) purposes.push('sale');
    if (formData.forRent) purposes.push('rent');
    if (formData.forAirbnb) purposes.push('airbnb');
    return purposes;
  };

  const getPrimaryPurpose = (): 'sale' | 'rent' | 'airbnb' => {
    if (formData.forSale) return 'sale';
    if (formData.forRent) return 'rent';
    return 'airbnb';
  };

  const getPrimaryPrice = (): number => {
    if (formData.forSale && formData.salePrice) return parseFloat(formData.salePrice);
    if (formData.forRent && formData.monthlyRent) return parseFloat(formData.monthlyRent);
    if (formData.forAirbnb && formData.nightlyRate) return parseFloat(formData.nightlyRate);
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update a property',
        variant: 'destructive',
      });
      return;
    }

    const purposes = getSelectedPurposes();
    if (purposes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one listing purpose (Sale, Rent, or Airbnb)',
        variant: 'destructive',
      });
      return;
    }

    // Validate prices for selected purposes
    if (formData.forSale && !formData.salePrice) {
      toast({ title: 'Error', description: 'Please enter a sale price', variant: 'destructive' });
      return;
    }
    if (formData.forRent && !isMultiUnit && !formData.monthlyRent) {
      toast({ title: 'Error', description: 'Please enter a monthly rent', variant: 'destructive' });
      return;
    }
    if (formData.forRent && isMultiUnit) {
      const validUnits = rentalUnits.filter(u => u.count && u.rent);
      if (validUnits.length === 0) {
        toast({ title: 'Error', description: 'Please add at least one rental unit with count and rent', variant: 'destructive' });
        return;
      }
    }
    if (formData.forAirbnb && !formData.nightlyRate) {
      toast({ title: 'Error', description: 'Please enter a nightly rate', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const rentalUnitsJson = isMultiUnit && formData.forRent
      ? rentalUnits.filter(u => u.count && u.rent).map(u => ({
          type: u.type,
          count: parseInt(u.count),
          rent: parseFloat(u.rent),
        }))
      : null;

    const computedMonthlyRent = isMultiUnit && rentalUnitsJson && rentalUnitsJson.length > 0
      ? Math.min(...rentalUnitsJson.map(u => u.rent))
      : formData.forRent && formData.monthlyRent ? parseFloat(formData.monthlyRent) : null;

    const { error } = await supabase
      .from('properties')
      .update({
        title: formData.title,
        description: formData.description,
        property_type: getPrimaryPurpose(),
        property_category: formData.property_category,
        price: getPrimaryPrice(),
        sale_price: formData.forSale && formData.salePrice ? parseFloat(formData.salePrice) : null,
        monthly_rent: computedMonthlyRent,
        nightly_rate: formData.forAirbnb && formData.nightlyRate ? parseFloat(formData.nightlyRate) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area_sqft: formData.area_sqft ? parseInt(formData.area_sqft) : null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: formData.amenities,
        images: formData.images,
        rental_units: rentalUnitsJson as any,
      })
      .eq('id', id)
      .eq('landlord_id', user.id);

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Property updated!', description: 'Your changes have been saved.' });
      navigate('/landlord/properties');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (isLoadingProperty) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </LandlordLayout>
    );
  }

  if (!property) {
    return (
      <LandlordLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Property not found or you don't have access to edit it.</p>
          <Link to="/landlord/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/landlord/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Edit Property</h1>
          <p className="text-muted-foreground mt-1 text-sm">Update your property listing details</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Images */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>Upload up to 10 photos of your property. First image is the cover.</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.id && (
                <PropertyImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                  userId={user.id}
                  maxImages={10}
                />
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Property title, type, and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Modern 3 Bedroom Apartment in Kilimani"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Property Category *</Label>
                <Select
                  value={formData.property_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, property_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your property..."
                  rows={4}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Select value={aiTone} onValueChange={(v: 'professional' | 'friendly' | 'luxury') => setAiTone(v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasActiveSubscription || isGenerating}
                            onClick={async () => {
                              setIsGenerating(true);
                              try {
                                const priceParts: string[] = [];
                                if (formData.forSale && formData.salePrice) priceParts.push(`Sale: KES ${formData.salePrice}`);
                                if (formData.forRent && formData.monthlyRent) priceParts.push(`Rent: KES ${formData.monthlyRent}/mo`);
                                if (formData.forAirbnb && formData.nightlyRate) priceParts.push(`Airbnb: KES ${formData.nightlyRate}/night`);

                                const { data, error } = await supabase.functions.invoke('generate-description', {
                                  body: {
                                    title: formData.title,
                                    category: formData.property_category,
                                    bedrooms: formData.bedrooms,
                                    bathrooms: formData.bathrooms,
                                    amenities: formData.amenities,
                                    location: [formData.address, formData.city, formData.state].filter(Boolean).join(', '),
                                    pricing: priceParts.join(' | ') || 'Not set',
                                    tone: aiTone,
                                  },
                                });
                                if (error) throw error;
                                if (data?.description) {
                                  setFormData(prev => ({ ...prev, description: data.description }));
                                  toast({ title: 'Description generated!', description: 'Feel free to edit it to your liking.' });
                                } else if (data?.error) {
                                  toast({ title: 'Error', description: data.error, variant: 'destructive' });
                                }
                              } catch (err: any) {
                                toast({ title: 'Error', description: err.message || 'Failed to generate description', variant: 'destructive' });
                              } finally {
                                setIsGenerating(false);
                              }
                            }}
                            className="gap-1.5"
                          >
                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasActiveSubscription ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasActiveSubscription && (
                        <TooltipContent>
                          <p>Subscribe to Makazi Pro to unlock AI descriptions</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Purpose & Pricing */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Listing Purpose & Pricing</CardTitle>
              <CardDescription>Select how you want to list this property and set prices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* For Sale */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="forSale"
                      checked={formData.forSale}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, forSale: !!checked }))}
                    />
                    <div>
                      <Label htmlFor="forSale" className="text-base font-medium cursor-pointer">For Sale</Label>
                      <p className="text-sm text-muted-foreground">List this property for purchase</p>
                    </div>
                  </div>
                </div>
                {formData.forSale && (
                  <div className="mt-4 ml-7">
                    <Label htmlFor="salePrice">Sale Price (KES) *</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={formData.salePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                      placeholder="e.g., 15000000"
                    />
                  </div>
                )}
              </div>

              {/* For Rent */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="forRent"
                      checked={formData.forRent}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, forRent: !!checked }))}
                    />
                    <div>
                      <Label htmlFor="forRent" className="text-base font-medium cursor-pointer">For Rent</Label>
                      <p className="text-sm text-muted-foreground">List this property for monthly rental</p>
                    </div>
                  </div>
                </div>
                {formData.forRent && (
                  <div className="mt-4 ml-7 space-y-4">
                    {showMultiUnitOption && (
                      <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/30">
                        <div>
                          <Label htmlFor="editMultiUnit" className="text-sm font-medium cursor-pointer">Multi-Unit Property</Label>
                          <p className="text-xs text-muted-foreground">Different unit types with separate pricing</p>
                        </div>
                        <Switch id="editMultiUnit" checked={isMultiUnit} onCheckedChange={setIsMultiUnit} />
                      </div>
                    )}

                    {!isMultiUnit ? (
                      <div>
                        <Label htmlFor="monthlyRent">Monthly Rent (KES) *</Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          value={formData.monthlyRent}
                          onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                          placeholder="e.g., 50000"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label>Rental Units</Label>
                        {rentalUnits.map((unit, index) => (
                          <div key={index} className="grid grid-cols-[1fr_80px_1fr_40px] gap-2 items-end">
                            <div>
                              {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Unit Type</Label>}
                              <Select value={unit.type} onValueChange={(v) => updateRentalUnit(index, 'type', v)}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_TYPE_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Units</Label>}
                              <Input
                                type="number"
                                className="h-9"
                                value={unit.count}
                                onChange={(e) => updateRentalUnit(index, 'count', e.target.value)}
                                placeholder="#"
                              />
                            </div>
                            <div>
                              {index === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Rent (KES)</Label>}
                              <Input
                                type="number"
                                className="h-9"
                                value={unit.rent}
                                onChange={(e) => updateRentalUnit(index, 'rent', e.target.value)}
                                placeholder="25000"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => removeRentalUnit(index)}
                              disabled={rentalUnits.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addRentalUnit}>
                          <Plus className="h-3.5 w-3.5" />
                          Add Unit Type
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* For Airbnb */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="forAirbnb"
                      checked={formData.forAirbnb}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, forAirbnb: !!checked }))}
                    />
                    <div>
                      <Label htmlFor="forAirbnb" className="text-base font-medium cursor-pointer">Airbnb / Short Stay</Label>
                      <p className="text-sm text-muted-foreground">List this property for short-term rentals</p>
                    </div>
                  </div>
                </div>
                {formData.forAirbnb && (
                  <div className="mt-4 ml-7">
                    <Label htmlFor="nightlyRate">Nightly Rate (KES) *</Label>
                    <Input
                      id="nightlyRate"
                      type="number"
                      value={formData.nightlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nightlyRate: e.target.value }))}
                      placeholder="e.g., 8000"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Bedrooms, bathrooms, and size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select value={formData.bedrooms} onValueChange={(value) => setFormData(prev => ({ ...prev, bedrooms: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n === 0 ? 'Studio/N/A' : n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select value={formData.bathrooms} onValueChange={(value) => setFormData(prev => ({ ...prev, bathrooms: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n === 0 ? 'N/A' : n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area_sqft}
                    onChange={(e) => setFormData(prev => ({ ...prev, area_sqft: e.target.value }))}
                    placeholder="e.g., 1200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is the property located? Pin the exact location on the map.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., 123 Ngong Road, Near Junction Mall"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Town/City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Westlands"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">County *</Label>
                  <Select
                    value={formData.state || undefined}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {KENYA_COUNTIES.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Map Location Picker */}
              <div className="pt-4">
                <Label className="mb-3 block">Pin Location on Map</Label>
                <LocationPicker
                  latitude={formData.latitude || undefined}
                  longitude={formData.longitude || undefined}
                  onLocationChange={(lat, lng, address) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      ...(address && !prev.address ? { address } : {}),
                    }));
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>Select available amenities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenitiesList.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${amenity}`}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <Label htmlFor={`edit-${amenity}`} className="font-normal cursor-pointer">{amenity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/landlord/properties')}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}
