import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Plus, MessageSquare, BarChart3, LogOut, User, Mail, CalendarDays, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/landlord', icon: BarChart3, label: 'Dashboard' },
    ],
  },
  {
    label: 'Properties',
    items: [
      { href: '/landlord/properties', icon: Building2, label: 'My Properties' },
      { href: '/landlord/add-property', icon: Plus, label: 'Add Property' },
    ],
  },
  {
    label: 'Bookings & Communication',
    items: [
      { href: '/landlord/airbnb-bookings', icon: CalendarDays, label: 'Airbnb Bookings' },
      { href: '/landlord/messages', icon: Mail, label: 'Messages' },
      { href: '/landlord/inquiries', icon: MessageSquare, label: 'Inquiries' },
    ],
  },
];

interface LandlordSidebarProps {
  onNavigate?: () => void;
}

export function LandlordSidebar({ onNavigate }: LandlordSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleNavClick = () => {
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
    navigate('/');
  };

  return (
    <aside className="w-72 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link to="/" onClick={handleNavClick} className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-foreground">Makazi</span>
            <span className="text-xs text-muted-foreground block">Landlord Portal</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {!isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 mb-2">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Landlord</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
