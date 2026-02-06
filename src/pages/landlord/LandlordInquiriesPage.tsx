import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Clock, CheckCircle, XCircle, Send, Building2, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeDate } from '@/lib/formatters';

interface Inquiry {
  id: string;
  property_id: string;
  sender_id: string;
  landlord_id: string;
  message: string;
  reply: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
}

interface Property {
  id: string;
  title: string;
  city: string;
  images: string[] | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

export default function LandlordInquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['landlord-inquiries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Inquiry[];
    },
    enabled: !!user?.id,
  });

  const { data: properties } = useQuery({
    queryKey: ['landlord-properties-map', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, city, images')
        .eq('landlord_id', user?.id);
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user?.id,
  });

  const { data: senderProfiles } = useQuery({
    queryKey: ['sender-profiles', inquiries?.map(i => i.sender_id)],
    queryFn: async () => {
      if (!inquiries?.length) return [];
      const senderIds = [...new Set(inquiries.map(i => i.sender_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', senderIds);
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!inquiries?.length,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ inquiryId, reply }: { inquiryId: string; reply: string }) => {
      const { error } = await supabase
        .from('inquiries')
        .update({
          reply,
          status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Reply sent successfully!' });
      queryClient.invalidateQueries({ queryKey: ['landlord-inquiries'] });
      setSelectedInquiry(null);
      setReplyText('');
    },
    onError: () => {
      toast({ title: 'Failed to send reply', variant: 'destructive' });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: 'closed' })
        .eq('id', inquiryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Inquiry closed' });
      queryClient.invalidateQueries({ queryKey: ['landlord-inquiries'] });
    },
  });

  const getProperty = (propertyId: string) => properties?.find(p => p.id === propertyId);
  const getSender = (senderId: string) => senderProfiles?.find(p => p.user_id === senderId);

  const filteredInquiries = inquiries?.filter(inquiry => 
    statusFilter === 'all' || inquiry.status === statusFilter
  ) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Replied</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: inquiries?.length ?? 0,
    pending: inquiries?.filter(i => i.status === 'pending').length ?? 0,
    replied: inquiries?.filter(i => i.status === 'replied').length ?? 0,
  };

  return (
    <LandlordLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Inquiries</h1>
          <p className="text-muted-foreground mt-1">View and respond to property inquiries</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Inquiries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Awaiting Reply</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
                <p className="text-sm text-muted-foreground">Replied</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inquiries List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Inquiries Yet</h3>
              <p className="text-muted-foreground">
                When potential tenants or buyers inquire about your properties, you'll see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => {
              const property = getProperty(inquiry.property_id);
              const sender = getSender(inquiry.sender_id);
              
              return (
                <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Property Image */}
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {property?.images?.[0] ? (
                          <img src={property.images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold truncate">{property?.title ?? 'Unknown Property'}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{sender?.full_name || sender?.email || 'Unknown User'}</span>
                              <span>•</span>
                              <span>{formatRelativeDate(inquiry.created_at)}</span>
                            </div>
                          </div>
                          {getStatusBadge(inquiry.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {inquiry.message}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={inquiry.status === 'pending' ? 'default' : 'outline'}
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setReplyText(inquiry.reply || '');
                            }}
                          >
                            {inquiry.status === 'pending' ? 'Reply' : 'View Details'}
                          </Button>
                          {inquiry.status !== 'closed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeMutation.mutate(inquiry.id)}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reply Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Message from user:</p>
                  <p className="text-sm text-muted-foreground">{selectedInquiry.message}</p>
                </div>
                
                {selectedInquiry.reply && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-1">Your reply:</p>
                    <p className="text-sm text-muted-foreground">{selectedInquiry.reply}</p>
                  </div>
                )}
                
                {selectedInquiry.status !== 'closed' && (
                  <div>
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                    />
                    <Button
                      className="w-full mt-3 gap-2"
                      onClick={() => replyMutation.mutate({ inquiryId: selectedInquiry.id, reply: replyText })}
                      disabled={!replyText.trim() || replyMutation.isPending}
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {selectedInquiry.reply ? 'Update Reply' : 'Send Reply'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LandlordLayout>
  );
}
