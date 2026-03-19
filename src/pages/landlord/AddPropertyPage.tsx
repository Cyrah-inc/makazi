import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, ArrowLeft, Home, Building, Landmark, Trees, Briefcase, Plus, Trash2, Sparkles, Lock, Eye, FileCheck } from 'lucide-react';
import { SingleDocumentUpload } from '@/components/landlord/SingleDocumentUpload';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { PropertyImageUpload } from '@/components/PropertyImageUpload';
import { LocationPicker } from '@/components/LocationPicker';
import { KENYA_COUNTIES } from '@/types/property';
import { useLandlordProfile } from '@/hooks/useLandlordProfile';
import { VerificationBanner } from '@/components/landlord/VerificationBanner';
import { SubscriptionPaymentDialog } from '@/components/landlord/SubscriptionPaymentDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function AddPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'luxury'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const { landlordProfile, isVerified, needsSubscription, canListProperty, hasActiveSubscription, isLoading: profileLoading } = useLandlordProfile();
  
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
    // Sale verification documents
    saleDocuments: [null, null, null, null, null] as (string | null)[],
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

  const showMultiUnitOption = formData.forRent && ['apartment', 'commercial', 'office'].includes(formData.property_category);

  const getSelectedPurposes = (): ListingPurpose[] => {
    const purposes: ListingPurpose[] = [];
    if (formData.forSale) purposes.push('sale');
    if (formData.forRent) purposes.push('rent');
    if (formData.forAirbnb) purposes.push('airbnb');
    return purposes;
  };

  const getPrimaryPurpose = (): 'sale' | 'rent' | 'airbnb' => {
    // Priority: sale > rent > airbnb
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
    
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add a property',
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
      toast({
        title: 'Error',
        description: 'Please enter a sale price',
        variant: 'destructive',
      });
      return;
    }
    // Validate sale documents
    if (formData.forSale && (!formData.saleDocuments[0] || !formData.saleDocuments[1])) {
      toast({
        title: 'Error',
        description: 'Please upload both the Title Deed and Land Search Certificate for sale listings',
        variant: 'destructive',
      });
      return;
    }
    if (formData.forRent && !isMultiUnit && !formData.monthlyRent) {
      toast({
        title: 'Error',
        description: 'Please enter a monthly rent',
        variant: 'destructive',
      });
      return;
    }
    if (formData.forRent && isMultiUnit) {
      const validUnits = rentalUnits.filter(u => u.count && u.rent);
      if (validUnits.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one rental unit with count and rent',
          variant: 'destructive',
        });
        return;
      }
    }
    if (formData.forAirbnb && !formData.nightlyRate) {
      toast({
        title: 'Error',
        description: 'Please enter a nightly rate',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Build rental_units JSON if multi-unit
    const rentalUnitsJson = isMultiUnit && formData.forRent
      ? rentalUnits.filter(u => u.count && u.rent).map(u => ({
          type: u.type,
          count: parseInt(u.count),
          rent: parseFloat(u.rent),
        }))
      : null;

    // For multi-unit, use lowest rent as headline monthly_rent
    const computedMonthlyRent = isMultiUnit && rentalUnitsJson && rentalUnitsJson.length > 0
      ? Math.min(...rentalUnitsJson.map(u => u.rent))
      : formData.forRent && formData.monthlyRent ? parseFloat(formData.monthlyRent) : null;

    const { error } = await supabase.from('properties').insert({
      landlord_id: user.id,
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
      country: 'Kenya',
      latitude: formData.latitude,
      longitude: formData.longitude,
      amenities: formData.amenities,
      images: formData.images,
      rental_units: rentalUnitsJson as any,
      sale_documents: formData.forSale ? formData.saleDocuments.filter(Boolean) : [],
      status: 'pending',
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Property submitted!',
        description: 'Your property is pending review by an admin.',
      });
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

  const isBlocked = !isVerified || needsSubscription;

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Add New Property</h1>
          <p className="text-muted-foreground mt-1 text-sm">Fill in the details to list your property</p>
        </div>

        {/* Verification / Subscription Banner */}
        {!profileLoading && landlordProfile && (
          <VerificationBanner
            verificationStatus={landlordProfile.verification_status}
            verificationNotes={landlordProfile.verification_notes}
            needsSubscription={needsSubscription}
            onSubscribe={() => setSubscriptionOpen(true)}
          />
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>Upload up to 10 photos of your property</CardDescription>
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
                <div className="mt-3 space-y-2">
                  <Input
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe what you want, e.g. 3 bedroom house in Kitengela with swimming pool..."
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
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
                                      customPrompt,
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
                    {formData.description && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewOpen(true)}
                        className="gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Dialog */}
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Description Preview</DialogTitle>
                  </DialogHeader>
                  <div className="border border-border rounded-lg p-6 bg-card">
                    <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                      {formData.title || 'Property Title'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {[formData.address, formData.city, formData.state].filter(Boolean).join(', ') || 'Location'}
                    </p>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {formData.description}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
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
                  <div className="mt-4 ml-0 sm:ml-7">
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
                  <div className="mt-4 ml-0 sm:ml-7 space-y-4">
                    {/* Multi-unit toggle */}
                    {showMultiUnitOption && (
                      <div className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/30">
                        <div>
                          <Label htmlFor="multiUnit" className="text-sm font-medium cursor-pointer">Multi-Unit Property</Label>
                          <p className="text-xs text-muted-foreground">Different unit types with separate pricing</p>
                        </div>
                        <Switch id="multiUnit" checked={isMultiUnit} onCheckedChange={setIsMultiUnit} />
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
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_1fr_40px] gap-2 items-end">
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
                  <Select value={formData.state || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
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
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <Label htmlFor={amenity} className="font-normal cursor-pointer">{amenity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-border sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0 sm:mx-0 sm:px-0 sm:border-0 z-10">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/landlord/properties')}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || isBlocked}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Property'
              )}
            </Button>
          </div>
        </form>
      </div>
      <SubscriptionPaymentDialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
    </LandlordLayout>
  );
}
