import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VerificationBannerProps {
  verificationStatus: string;
  verificationNotes?: string | null;
  needsSubscription?: boolean;
  onSubscribe?: () => void;
}

export function VerificationBanner({ verificationStatus, verificationNotes, needsSubscription, onSubscribe }: VerificationBannerProps) {
  if (verificationStatus === 'verified' && !needsSubscription) return null;

  const configs: Record<string, { icon: React.ReactNode; bg: string; text: string; message: string; action?: React.ReactNode }> = {
    unverified: {
      icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      bg: 'bg-accent/10 border-accent/20 text-accent',
      text: 'text-accent',
      message: 'Complete your profile verification to start listing properties.',
      action: (
        <Link to="/landlord/profile">
          <Button size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
            Complete Profile
          </Button>
        </Link>
      ),
    },
    pending: {
      icon: <Clock className="w-5 h-5 shrink-0" />,
      bg: 'bg-[hsl(var(--gold))]/10 border-[hsl(var(--gold))]/20 text-[hsl(var(--gold-foreground))]',
      text: 'text-[hsl(var(--gold-foreground))]',
      message: 'Your verification is under review. We\'ll notify you once it\'s approved.',
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 shrink-0" />,
      bg: 'bg-destructive/10 border-destructive/20 text-destructive',
      text: 'text-destructive',
      message: verificationNotes
        ? `Verification rejected: ${verificationNotes}`
        : 'Your verification was rejected. Please update your documents and resubmit.',
      action: (
        <Link to="/landlord/profile">
          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Update Profile
          </Button>
        </Link>
      ),
    },
  };

  // Subscription needed banner
  if (verificationStatus === 'verified' && needsSubscription) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border bg-primary/5 border-primary/20">
        <CreditCard className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm flex-1">You've reached the free tier limit of 5 properties. Subscribe to list more.</p>
        <Button size="sm" onClick={onSubscribe} className="shrink-0">
          Subscribe — KES 2,000/mo
        </Button>
      </div>
    );
  }

  const config = configs[verificationStatus];
  if (!config) return null;

  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border', config.bg)}>
      {config.icon}
      <p className={cn('text-sm flex-1', config.text)}>{config.message}</p>
      {config.action && <div className="shrink-0">{config.action}</div>}
    </div>
  );
}
