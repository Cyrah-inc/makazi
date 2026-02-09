import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserLayout } from '@/components/user/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Clock, CheckCircle, XCircle, Building2, ArrowRight } from 'lucide-react';
import { InquiryCardSkeleton } from '@/components/skeletons/ListSkeletons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
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
  replied_at: string | null;
}

interface Property {
  id: string;
  title: string;
  city: string;
  images: string[] | null;
}

export default function UserInquiriesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['user-inquiries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Inquiry[];
    },
    enabled: !!user?.id,
  });

  const { data: properties } = useQuery({
    queryKey: ['inquiry-properties', inquiries?.map(i => i.property_id)],
    queryFn: async () => {
      if (!inquiries?.length) return [];
      const propertyIds = [...new Set(inquiries.map(i => i.property_id))];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, city, images')
        .in('id', propertyIds);
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!inquiries?.length,
  });

  const getProperty = (propertyId: string) => properties?.find(p => p.id === propertyId);

  const filteredInquiries = inquiries?.filter(inquiry => 
    statusFilter === 'all' || inquiry.status === statusFilter
  ) ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-accent text-accent"><Clock className="w-3 h-3 mr-1" /> Awaiting Reply</Badge>;
      case 'replied':
        return <Badge variant="outline" className="border-primary text-primary"><CheckCircle className="w-3 h-3 mr-1" /> Replied</Badge>;
      case 'closed':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">My Inquiries</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track your property inquiries and landlord responses</p>
          </div>

          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inquiries</SelectItem>
              <SelectItem value="pending">Awaiting Reply</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inquiries List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <InquiryCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Inquiries Yet</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Start browsing properties and send inquiries to landlords
              </p>
              <Link to="/">
                <Button>Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry) => {
              const property = getProperty(inquiry.property_id);
              
              return (
                <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Property Image */}
                      <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {property?.images?.[0] ? (
                          <img src={property.images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold">{property?.title ?? 'Property'}</h4>
                            <p className="text-sm text-muted-foreground">{property?.city}</p>
                          </div>
                          {getStatusBadge(inquiry.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {inquiry.message}
                        </p>

                        {inquiry.status === 'replied' && inquiry.reply && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg mb-3">
                            <p className="text-xs font-medium text-primary mb-1">Landlord replied:</p>
                            <p className="text-sm text-foreground line-clamp-2">{inquiry.reply}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            Sent {formatRelativeDate(inquiry.created_at)}
                            {inquiry.replied_at && ` • Replied ${formatRelativeDate(inquiry.replied_at)}`}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedInquiry(inquiry)}
                            >
                              View Details
                            </Button>
                            {property && (
                              <Link to={`/property/${property.id}`}>
                                <Button size="sm" variant="ghost">
                                  View Property <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Inquiry Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Property</p>
                  <p className="text-sm text-muted-foreground">
                    {getProperty(selectedInquiry.property_id)?.title ?? 'Unknown Property'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Your Message</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{selectedInquiry.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {formatRelativeDate(selectedInquiry.created_at)}
                  </p>
                </div>
                
                {selectedInquiry.reply ? (
                  <div>
                    <p className="text-sm font-medium mb-1">Landlord's Reply</p>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm">{selectedInquiry.reply}</p>
                    </div>
                    {selectedInquiry.replied_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Replied {formatRelativeDate(selectedInquiry.replied_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg text-center">
                    <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
                    <p className="text-sm text-accent">Awaiting landlord's reply</p>
                  </div>
                )}

                <div className="pt-2">
                  {getProperty(selectedInquiry.property_id) && (
                    <Link to={`/property/${selectedInquiry.property_id}`}>
                      <Button className="w-full">
                        View Property <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
}
