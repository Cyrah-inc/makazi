import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Star, Trash2, Search, Loader2, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { formatRelativeDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface EnrichedReview {
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string;
  landlord_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  guest_name: string;
  guest_email: string | null;
  property_title: string;
  landlord_name: string;
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async (): Promise<EnrichedReview[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      const guestIds = [...new Set(data.map((r) => r.guest_id))];
      const landlordIds = [...new Set(data.map((r) => r.landlord_id))];
      const propIds = [...new Set(data.map((r) => r.property_id))];

      const [guestRes, landlordRes, propRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', guestIds),
        supabase.from('profiles').select('user_id, full_name').in('user_id', landlordIds),
        supabase.from('properties').select('id, title').in('id', propIds),
      ]);

      const guestMap = new Map(guestRes.data?.map((p) => [p.user_id, p]) || []);
      const landlordMap = new Map(landlordRes.data?.map((p) => [p.user_id, p]) || []);
      const propMap = new Map(propRes.data?.map((p) => [p.id, p.title]) || []);

      return data.map((r) => ({
        ...r,
        guest_name: guestMap.get(r.guest_id)?.full_name || 'Guest',
        guest_email: guestMap.get(r.guest_id)?.email || null,
        property_title: propMap.get(r.property_id) || 'Unknown',
        landlord_name: landlordMap.get(r.landlord_id)?.full_name || 'Unknown',
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review deleted', description: 'The review has been removed.' });
      setDeleteId(null);
    },
    onError: (e) => {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    },
  });

  const filtered = reviews.filter((r) => {
    const matchSearch =
      !search ||
      r.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      r.property_title.toLowerCase().includes(search.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === null || r.rating === ratingFilter;
    return matchSearch && matchRating;
  });

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // Landlord ratings
  const landlordRatings = new Map<string, { name: string; total: number; count: number }>();
  reviews.forEach((r) => {
    const existing = landlordRatings.get(r.landlord_id) || { name: r.landlord_name, total: 0, count: 0 };
    existing.total += r.rating;
    existing.count += 1;
    landlordRatings.set(r.landlord_id, existing);
  });
  const topLandlords = [...landlordRatings.entries()]
    .map(([id, d]) => ({ id, name: d.name, avg: d.total / d.count, count: d.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Property ratings
  const propRatings = new Map<string, { title: string; total: number; count: number }>();
  reviews.forEach((r) => {
    const existing = propRatings.get(r.property_id) || { title: r.property_title, total: 0, count: 0 };
    existing.total += r.rating;
    existing.count += 1;
    propRatings.set(r.property_id, existing);
  });
  const topProperties = [...propRatings.entries()]
    .map(([id, d]) => ({ id, title: d.title, avg: d.total / d.count, count: d.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <h1 className="font-heading text-2xl font-bold">Reviews Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--gold))]/10">
                <Star className="h-5 w-5 text-[hsl(var(--gold))]" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{reviews.length}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">
                  {reviews.filter((r) => r.rating >= 4).length}
                </p>
                <p className="text-xs text-muted-foreground">Positive (4-5★)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">
                  {reviews.filter((r) => r.rating <= 2).length}
                </p>
                <p className="text-xs text-muted-foreground">Negative (1-2★)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Users className="h-4 w-4" /> Top Rated Landlords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLandlords.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topLandlords.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.count} review{l.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                        <span className="text-sm font-semibold">{l.avg.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Star className="h-4 w-4" /> Top Rated Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topProperties.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.count} review{p.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                        <span className="text-sm font-semibold">{p.avg.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Reviews Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={ratingFilter === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRatingFilter(null)}
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map((r) => (
                  <Button
                    key={r}
                    variant={ratingFilter === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRatingFilter(ratingFilter === r ? null : r)}
                    className="gap-1"
                  >
                    {r}<Star className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No reviews found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.guest_name}</p>
                            {r.guest_email && (
                              <p className="text-xs text-muted-foreground">{r.guest_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {r.property_title}
                        </TableCell>
                        <TableCell className="text-sm">{r.landlord_name}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  r.rating >= s
                                    ? 'fill-[hsl(var(--gold))] text-[hsl(var(--gold))]'
                                    : 'text-muted-foreground/20'
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {r.comment || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
