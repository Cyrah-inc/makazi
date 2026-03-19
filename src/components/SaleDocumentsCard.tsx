import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Lock, FileText, Download, Loader2, CheckCircle2, Phone } from 'lucide-react';

interface SaleDocumentsCardProps {
  propertyId: string;
  saleDocuments: string[];
}

const DOC_LABELS = ['Title Deed', 'Land Search Certificate', 'Additional Document', 'Additional Document', 'Additional Document'];

export function SaleDocumentsCard({ propertyId, saleDocuments }: SaleDocumentsCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<number, string>>({});

  // Check if user has a completed purchase
  const { data: hasPurchased, isLoading: checkingPurchase } = useQuery({
    queryKey: ['document-purchase', propertyId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_purchases')
        .select('id, status')
        .eq('user_id', user!.id)
        .eq('property_id', propertyId)
        .eq('status', 'completed')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Generate signed URLs when purchased
  const loadSignedUrls = async () => {
    const urls: Record<number, string> = {};
    for (let i = 0; i < saleDocuments.length; i++) {
      const path = saleDocuments[i];
      if (!path) continue;
      const { data } = await supabase.storage
        .from('landlord-documents')
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) urls[i] = data.signedUrl;
    }
    setSignedUrls(urls);
  };

  // Load URLs when purchased
  useQuery({
    queryKey: ['sale-doc-urls', propertyId],
    queryFn: async () => {
      await loadSignedUrls();
      return true;
    },
    enabled: !!hasPurchased && saleDocuments.length > 0,
  });

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to access property documents', variant: 'destructive' });
      return;
    }
    if (!phone) {
      toast({ title: 'Phone required', description: 'Enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-document-checkout', {
        body: { property_id: propertyId, phone_number: phone },
      });

      if (error) throw error;
      if (data?.already_purchased) {
        queryClient.invalidateQueries({ queryKey: ['document-purchase', propertyId] });
        toast({ title: 'Already purchased', description: 'You already have access to these documents' });
        return;
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Check your phone',
        description: 'Enter your M-Pesa PIN to complete the payment of KES 1,500',
      });

      // Poll for completion
      const purchaseId = data.purchase_id;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: purchase } = await supabase
          .from('document_purchases')
          .select('status')
          .eq('id', purchaseId)
          .single();

        if (purchase?.status === 'completed') {
          clearInterval(poll);
          setIsProcessing(false);
          queryClient.invalidateQueries({ queryKey: ['document-purchase', propertyId] });
          toast({ title: 'Payment successful!', description: 'You can now download the property documents' });
        } else if (purchase?.status === 'failed' || attempts >= 30) {
          clearInterval(poll);
          setIsProcessing(false);
          if (purchase?.status === 'failed') {
            toast({ title: 'Payment failed', description: 'The M-Pesa transaction was not completed', variant: 'destructive' });
          } else {
            toast({ title: 'Timeout', description: 'Payment verification timed out. If you paid, documents will appear shortly.', variant: 'destructive' });
          }
        }
      }, 5000);
    } catch (err: any) {
      setIsProcessing(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getFileName = (path: string, index: number) => {
    return DOC_LABELS[index] || `Document ${index + 1}`;
  };

  if (saleDocuments.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold text-lg">Property Verification Documents</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Access verified property documents including the title deed and land search certificate to confirm ownership and legitimacy.
        </p>

        {/* Document list */}
        <div className="space-y-2 mb-4">
          {saleDocuments.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${hasPurchased ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${hasPurchased ? '' : 'text-muted-foreground'}`}>
                  {getFileName(doc, idx)}
                </span>
              </div>
              {hasPurchased && signedUrls[idx] ? (
                <a href={signedUrls[idx]} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </a>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          ))}
        </div>

        {checkingPurchase ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasPurchased ? (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>You have access to all verification documents</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm font-medium mb-1">Access all documents for KES 1,500</p>
              <p className="text-xs text-muted-foreground">
                One-time payment via M-Pesa. Only serious buyers should proceed.
              </p>
            </div>
            <div>
              <Label htmlFor="doc-phone" className="text-sm">M-Pesa Phone Number</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="doc-phone"
                    type="tel"
                    placeholder="0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || !phone}
                  className="shrink-0"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</>
                  ) : (
                    'Pay KES 1,500'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
