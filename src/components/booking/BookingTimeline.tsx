import { BookingStatus } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Clock, CreditCard, LogIn, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const TIMELINE_STEPS: { status: BookingStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending_payment', label: 'Booked', icon: Clock },
  { status: 'paid', label: 'Paid', icon: CreditCard },
  { status: 'checked_in', label: 'Checked In', icon: LogIn },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
];

const STATUS_ORDER: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  checked_in: 2,
  completed: 3,
  cancelled: -1,
  refunded: -1,
};

interface BookingTimelineProps {
  status: string;
}

export function BookingTimeline({ status }: BookingTimelineProps) {
  const currentIndex = STATUS_ORDER[status] ?? -1;
  const isCancelled = status === 'cancelled';
  const isRefunded = status === 'refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        {isCancelled ? (
          <XCircle className="h-6 w-6 text-destructive shrink-0" />
        ) : (
          <RotateCcw className="h-6 w-6 shrink-0" style={{ color: 'hsl(30, 80%, 50%)' }} />
        )}
        <div>
          <p className="font-medium text-sm">
            {isCancelled ? 'Booking Cancelled' : 'Booking Refunded'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isCancelled
              ? 'This booking was cancelled.'
              : 'This booking has been refunded.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop horizontal timeline */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border" />
        <div
          className="absolute top-5 left-[10%] h-0.5 bg-primary transition-all duration-500"
          style={{
            width: currentIndex >= 0
              ? `${Math.min((currentIndex / (TIMELINE_STEPS.length - 1)) * 80, 80)}%`
              : '0%',
          }}
        />

        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center gap-2 z-10 relative">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-md'
                    : isActive
                    ? 'bg-primary/20 text-primary border-primary'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="sm:hidden space-y-1">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2',
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isActive
                      ? 'bg-primary/20 text-primary border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div className={cn('w-0.5 h-6', isActive ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
              <span
                className={cn(
                  'text-sm -mt-1',
                  isCurrent ? 'font-semibold text-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
