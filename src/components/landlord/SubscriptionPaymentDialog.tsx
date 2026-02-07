import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CreditCard, Phone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMethod = 'mpesa' | 'stripe';

export function SubscriptionPaymentDialog({ open, onOpenChange }: SubscriptionPaymentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user?.id) return;

    if (method === 'mpesa' && !phone) {
      toast({ title: 'Phone required', description: 'Enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-subscription', {
        body: {
          payment_method: method,
          phone: method === 'mpesa' ? phone : undefined,
        },
      });

      if (error) throw error;

      toast({ title: 'Subscription activated!', description: 'You can now list unlimited properties for 30 days.' });
      queryClient.invalidateQueries({ queryKey: ['landlord-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['landlord-property-count'] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Payment failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Subscribe to Makazi Pro</DialogTitle>
          <DialogDescription>List unlimited properties for KES 2,000/month</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Plan card */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Makazi Pro Plan</p>
                <p className="text-sm text-muted-foreground">Unlimited property listings</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">KES 2,000</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs"><Check className="w-3 h-3 mr-1" /> Unlimited listings</Badge>
              <Badge variant="secondary" className="text-xs"><Check className="w-3 h-3 mr-1" /> Priority support</Badge>
              <Badge variant="secondary" className="text-xs"><Check className="w-3 h-3 mr-1" /> 30-day validity</Badge>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('mpesa')}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  method === 'mpesa'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                <Phone className="w-5 h-5 mb-1 text-primary" />
                <p className="font-medium text-sm">M-Pesa</p>
                <p className="text-xs text-muted-foreground">Pay via STK push</p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('stripe')}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  method === 'stripe'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                <CreditCard className="w-5 h-5 mb-1 text-primary" />
                <p className="font-medium text-sm">Card / Stripe</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
              </button>
            </div>
          </div>

          {/* M-Pesa phone input */}
          {method === 'mpesa' && (
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
              <Input
                id="mpesa-phone"
                type="tel"
                placeholder="e.g., 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              `Pay KES 2,000 via ${method === 'mpesa' ? 'M-Pesa' : 'Stripe'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
