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
import { Loader2, ArrowLeft, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PropertyImageUpload } from '@/components/PropertyImageUpload';
import { LocationPicker } from '@/components/LocationPicker';

const amenitiesList = [
  'Parking', 'Swimming Pool', 'Gym', 'Security', 'Garden', 
  'Balcony', 'Air Conditioning', 'Furnished', 'WiFi', 'Laundry'
];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'rent' as 'sale' | 'rent' | 'airbnb',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    amenities: [] as string[],
    images: [] as string[],
  });

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
      setFormData({
        title: property.title || '',
        description: property.description || '',
        property_type: property.property_type || 'rent',
        price: property.price?.toString() || '',
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

    setIsLoading(true);

    const { error } = await supabase
      .from('properties')
      .update({
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
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
      })
      .eq('id', id)
      .eq('landlord_id', user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Property updated!',
        description: 'Your changes have been saved.',
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...formData.images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (isLoadingProperty) {
    return (
      <LandlordLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </LandlordLayout>
    );
  }

  if (!property) {
    return (
      <LandlordLayout>
        <div className="p-8 text-center">
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
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/landlord/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Edit Property</h1>
          <p className="text-muted-foreground mt-1">Update your property listing details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>Drag images to reorder. First image is the cover photo.</CardDescription>
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
              
              {/* Reorderable Images */}
              {formData.images.length > 1 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Drag to reorder:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((url, index) => (
                      <div
                        key={url}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative flex items-center gap-1 p-1 border rounded-md cursor-move transition-opacity ${
                          draggedIndex === index ? 'opacity-50' : ''
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          loading="lazy"
                          className="w-16 h-12 object-cover rounded"
                        />
                        <span className="text-xs text-muted-foreground px-1">
                          {index === 0 ? 'Cover' : index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Property title and description</CardDescription>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Listing Type *</Label>
                  <Select value={formData.property_type} onValueChange={(value: 'sale' | 'rent' | 'airbnb') => setFormData(prev => ({ ...prev, property_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Bedrooms, bathrooms, and size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select value={formData.bedrooms} onValueChange={(value) => setFormData(prev => ({ ...prev, bedrooms: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
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
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
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
              <CardDescription>Where is the property located?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., 123 Ngong Road"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Nairobi"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">County/State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., Nairobi County"
                  />
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

          <div className="flex gap-4">
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
