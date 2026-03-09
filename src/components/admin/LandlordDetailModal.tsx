import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle, XCircle, Loader2, Mail, Phone, FileText, ExternalLink,
  Home, Star, CreditCard, Calendar, AlertTriangle, ShieldCheck, ShieldX,
  Building2, BadgeCheck, Clock, ChevronLeft, ChevronRight, Eye, Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/* ── helpers ── */

function extractFilePath(url: string): string {
  if (!url.startsWith('http')) return url;
  const match = url.match(/landlord-documents\/(.+)$/);
  return match ? match[1] : url;
}

const DOCUMENT_LABELS: Record<number, string> = {
  0: 'National ID',
  1: 'KRA Certificate',
};

function getDocumentLabel(index: number): string {
  return DOCUMENT_LABELS[index] || `Document ${index + 1}`;
}

function isImageFile(path: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

function isPdfFile(path: string): boolean {
  return /\.pdf$/i.test(path);
}

/* ── types ── */

export interface LandlordData {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  avatar_url: string | null;
  id_number: string | null;
  kra_pin: string | null;
  business_phone: string | null;
  documents: string[];
  verification_status: string;
  verification_notes: string | null;
  verified_at: string | null;
  propertyCount: number;
  totalViews: number;
  averageRating: number | null;
  subscriptionStatus: string | null;
  subscriptionExpiry: string | null;
  subscriptionId: string | null;
}

export const verificationColors: Record<string, string> = {
  verified: 'bg-primary/10 text-primary',
  pending: 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-foreground))]',
  rejected: 'bg-destructive/10 text-destructive',
  unverified: 'bg-muted text-muted-foreground',
};

/* ── document completeness check ── */

interface DocCheck {
  label: string;
  ok: boolean;
}

function getDocumentChecklist(landlord: LandlordData): DocCheck[] {
  return [
    { label: 'National ID Number', ok: !!landlord.id_number },
    { label: 'KRA PIN', ok: !!landlord.kra_pin },
    { label: 'Business Phone', ok: !!landlord.business_phone },
    { label: 'Supporting Documents (at least 1)', ok: landlord.documents.length > 0 },
  ];
}

function allDocumentsComplete(landlord: LandlordData): boolean {
  return getDocumentChecklist(landlord).every((c) => c.ok);
}

/* ── Main Modal Component ── */

interface LandlordDetailModalProps {
  landlord: LandlordData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function LandlordDetailModal({ landlord, open, onOpenChange, onActionComplete }: LandlordDetailModalProps) {
  const [verifyNotes, setVerifyNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Document preview state
  const [signedUrls, setSignedUrls] = useState<Map<number, string>>(new Map());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setVerifyNotes('');
      setCancelReason('');
      setPreviewIndex(null);
      setSignedUrls(new Map());
    }
  }, [open]);

  // Generate signed URLs for all documents
  useEffect(() => {
    if (!open || !landlord?.documents?.length) return;

    const generateUrls = async () => {
      const urlMap = new Map<number, string>();
      await Promise.all(
        landlord.documents.map(async (doc, i) => {
          const path = extractFilePath(doc);
          const { data } = await supabase.storage
            .from('landlord-documents')
            .createSignedUrl(path, 3600);
          if (data?.signedUrl) {
            urlMap.set(i, data.signedUrl);
          }
        })
      );
      setSignedUrls(urlMap);
    };
    generateUrls();
  }, [open, landlord?.documents]);

  if (!landlord) return null;

  const checklist = getDocumentChecklist(landlord);
  const docsComplete = allDocumentsComplete(landlord);

  const handleVerify = async (action: 'verified' | 'rejected') => {
    setActionLoading(true);
    try {
      if (action === 'verified' && !docsComplete) {
        toast({
          title: 'Cannot verify',
          description: 'All required documents must be submitted before verification.',
          variant: 'destructive',
        });
        setActionLoading(false);
        return;
      }

      const { error } = await supabase
        .from('landlord_profiles')
        .update({
          verification_status: action,
          verification_notes: action === 'rejected' ? verifyNotes : null,
          verified_at: action === 'verified' ? new Date().toISOString() : null,
          verified_by: action === 'verified' ? user?.id : null,
        })
        .eq('user_id', landlord.user_id);

      if (error) throw error;

      toast({ title: action === 'verified' ? 'Landlord verified!' : 'Verification rejected' });
      onOpenChange(false);
      onActionComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!landlord.subscriptionId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          expires_at: new Date().toISOString(),
        })
        .eq('id', landlord.subscriptionId);

      if (error) throw error;

      toast({ title: 'Subscription cancelled', description: `Reason: ${cancelReason}` });
      setCancelDialogOpen(false);
      onOpenChange(false);
      onActionComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const isSubActive = landlord.subscriptionStatus === 'active' && landlord.subscriptionExpiry && new Date(landlord.subscriptionExpiry) > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {landlord.full_name || 'Landlord Details'}
            {landlord.verification_status === 'verified' && (
              <BadgeCheck className="w-5 h-5 text-primary" />
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" /> {landlord.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* ── Status Badges ── */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('text-sm', verificationColors[landlord.verification_status] || verificationColors.unverified)}>
              {landlord.verification_status}
            </Badge>
            {isSubActive ? (
              <Badge className="bg-primary/10 text-primary text-sm">Subscribed</Badge>
            ) : (
              <Badge variant="secondary" className="text-sm">Free Tier</Badge>
            )}
            <Badge variant="outline" className="text-sm">
              Account: {landlord.status}
            </Badge>
          </div>

          {/* ── Contact & Basic Info ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Phone" value={landlord.phone || 'N/A'} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoItem label="Business Phone" value={landlord.business_phone || 'N/A'} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoItem label="ID Number" value={landlord.id_number || 'Not provided'} />
              <InfoItem label="KRA PIN" value={landlord.kra_pin || 'Not provided'} />
              <InfoItem label="Joined" value={format(new Date(landlord.created_at), 'MMM d, yyyy')} icon={<Calendar className="w-3.5 h-3.5" />} />
            </div>
          </div>

          <Separator />

          {/* ── Performance Stats ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Performance
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Properties" value={String(landlord.propertyCount)} icon={<Home className="w-4 h-4 text-muted-foreground" />} />
              <StatBox label="Total Views" value={String(landlord.totalViews)} icon={<Building2 className="w-4 h-4 text-muted-foreground" />} />
              <StatBox
                label="Rating"
                value={landlord.averageRating ? landlord.averageRating.toFixed(1) : 'N/A'}
                icon={<Star className="w-4 h-4 text-[hsl(var(--gold))]" />}
              />
            </div>
          </div>

          <Separator />

          {/* ── Document Checklist ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Verification Checklist
            </h4>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.ok ? (
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                </div>
              ))}
            </div>
            {!docsComplete && landlord.verification_status === 'pending' && (
              <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Missing required documents. Cannot approve verification until all items are complete.</span>
              </div>
            )}
          </div>

          {/* ── Uploaded Documents ── */}
          {landlord.documents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Uploaded Documents ({landlord.documents.length})
              </h4>
              <div className="space-y-2">
                {landlord.documents.map((doc, i) => (
                  <AdminDocumentLink key={i} docPath={doc} index={i} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Subscription Details ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Subscription
            </h4>
            {isSubActive ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-primary">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">{format(new Date(landlord.subscriptionExpiry!), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full gap-2">
                      <ShieldX className="w-4 h-4" />
                      Cancel Subscription (Policy Violation)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Landlord Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately cancel {landlord.full_name}'s subscription due to policy violation. This action cannot be undone. The landlord will be moved to the free tier.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                      <Label>Reason for cancellation *</Label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Describe the policy violation..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          if (!cancelReason.trim()) {
                            toast({ title: 'Reason required', description: 'Please provide a reason for cancellation.', variant: 'destructive' });
                            return;
                          }
                          handleCancelSubscription();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Confirm Cancellation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground text-center">
                No active subscription — Free tier
              </div>
            )}
          </div>

          <Separator />

          {/* ── Verification Actions ── */}
          {landlord.verification_status === 'pending' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Verification Decision
              </h4>
              <div>
                <Label>Admin Notes (optional for approval, required for rejection)</Label>
                <Textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Reason for rejection or notes..."
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleVerify('verified')}
                  disabled={actionLoading || !docsComplete}
                  className="flex-1 gap-2"
                  title={!docsComplete ? 'All documents must be submitted first' : ''}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!verifyNotes.trim()) {
                      toast({ title: 'Notes required', description: 'Please provide a reason for rejection.', variant: 'destructive' });
                      return;
                    }
                    handleVerify('rejected');
                  }}
                  disabled={actionLoading}
                  className="flex-1 gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </Button>
              </div>
            </div>
          )}

          {landlord.verification_status === 'unverified' && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground text-center">
              <ShieldX className="w-5 h-5 mx-auto mb-1" />
              Landlord has not yet submitted verification documents.
            </div>
          )}

          {landlord.verification_status === 'verified' && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
              Verified {landlord.verified_at && `on ${format(new Date(landlord.verified_at), 'MMM d, yyyy')}`}
            </div>
          )}

          {landlord.verification_status === 'rejected' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <strong>Rejected:</strong> {landlord.verification_notes}
              </div>
              {/* Allow re-review */}
              <div>
                <Label>Re-review Notes</Label>
                <Textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Notes for re-evaluation..."
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleVerify('verified')}
                  disabled={actionLoading || !docsComplete}
                  className="flex-1 gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── small sub-components ── */

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium flex items-center gap-1.5 mt-0.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg border border-border text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
