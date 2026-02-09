import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserLayout } from '@/components/user/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, Clock, CheckCircle, Heart, Building2, ArrowRight, 
  User, Camera, Mail, Phone, Pencil, Save, X, Loader2, CalendarDays, DollarSign, MapPin
} from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { StatsCardSkeleton } from '@/components/skeletons/StatsCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestBookings } from '@/hooks/useBookings';
import { BOOKING_STATUS_CONFIG, BookingStatus } from '@/types/booking';
import { Link } from 'react-router-dom';
import { formatRelativeDate, formatFullPrice, formatDate } from '@/lib/formatters';
import { getBookingRelativeLabel } from '@/lib/bookingUtils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// User profile dashboard
export default function UserDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { data: bookings } = useGuestBookings();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Initialize form when profile loads
  const initializeForm = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
      });
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update profile. Please try again.', variant: 'destructive' });
    },
  });

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 2MB.', variant: 'destructive' });
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      toast({ title: 'Avatar updated', description: 'Your profile picture has been changed.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Could not upload avatar. Please try again.', variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Fetch inquiries
  const { data: inquiries } = useQuery({
    queryKey: ['user-inquiries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const stats = {
    totalInquiries: inquiries?.length ?? 0,
    pending: inquiries?.filter(i => i.status === 'pending').length ?? 0,
    replied: inquiries?.filter(i => i.status === 'replied').length ?? 0,
  };

  const bookingStats = {
    total: bookings?.length ?? 0,
    upcoming: bookings?.filter(b => ['pending_payment', 'paid'].includes(b.status)).length ?? 0,
    totalSpent: bookings
      ?.filter(b => !['cancelled', 'refunded'].includes(b.status))
      .reduce((sum, b) => sum + b.total_amount, 0) ?? 0,
  };

  const recentBookings = bookings?.slice(0, 3) ?? [];
  const recentInquiries = inquiries?.slice(0, 3) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-accent text-accent"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'replied':
        return <Badge variant="outline" className="border-primary text-primary"><CheckCircle className="w-3 h-3 mr-1" /> Replied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const handleEditClick = () => {
    initializeForm();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ full_name: '', email: '', phone: '' });
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  if (profileLoading) {
    return (
      <UserLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <ProfileSkeleton />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl sm:text-2xl">My Profile</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-muted">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary">
                      {getInitials(profile?.full_name, profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {avatarUploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground text-center">Click to change photo</p>
              </div>

              {/* Profile Details */}
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" /> Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2">{profile?.full_name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2">{profile?.email || user?.email || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" /> Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-foreground font-medium py-2">{profile?.phone || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label className="text-muted-foreground">Account Status</Label>
                  <div className="py-2">
                    <Badge variant="outline" className="capitalize">{profile?.status || 'active'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Inquiries</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalInquiries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Awaiting Reply</CardTitle>
              <Clock className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Replies</CardTitle>
              <CheckCircle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.replied}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{bookingStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
              <CalendarDays className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{bookingStats.upcoming}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Money Spent</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatFullPrice(bookingStats.totalSpent)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Browse Properties</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Explore available listings</p>
                </div>
                <Link to="/">
                  <Button variant="outline" size="sm" className="shrink-0">
                    <span className="hidden sm:inline">Browse</span>
                    <ArrowRight className="w-4 h-4 sm:ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Saved Properties</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">View your favorites</p>
                </div>
                <Link to="/dashboard/favorites">
                  <Button variant="outline" size="sm" className="shrink-0">
                    <span className="hidden sm:inline">View</span>
                    <ArrowRight className="w-4 h-4 sm:ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">Recent Bookings</CardTitle>
            <Link to="/dashboard/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Link to="/airbnb">
                  <Button>Browse Airbnb Stays</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => {
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as BookingStatus];
                  const relativeLabel = getBookingRelativeLabel(booking.check_in_date, booking.check_out_date, booking.status);
                  return (
                    <Link key={booking.id} to={`/dashboard/bookings/${booking.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="hidden sm:flex w-10 h-10 rounded-full bg-muted items-center justify-center shrink-0">
                            <CalendarDays className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{booking.property_title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {booking.property_city}
                              <span className="mx-1">·</span>
                              {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">{relativeLabel.text}</span>
                          <Badge className={cn('text-xs shrink-0', statusConfig?.color)}>
                            {statusConfig?.label}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">Recent Inquiries</CardTitle>
            <Link to="/dashboard/inquiries">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInquiries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't sent any inquiries yet</p>
                <Link to="/">
                  <Button>Browse Properties</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInquiries.map((inquiry) => (
                  <div 
                    key={inquiry.id} 
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-muted items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2 sm:line-clamp-1">{inquiry.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(inquiry.created_at)}</p>
                    </div>
                    <div className="flex justify-end">
                      {getStatusBadge(inquiry.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
