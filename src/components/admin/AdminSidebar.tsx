import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserCheck, 
  Settings, 
  LogOut,
  Home,
  FileText,
  CalendarDays,
  DollarSign,
  Shield,
  BarChart3
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: UserCheck, label: 'Landlords', path: '/admin/landlords' },
  { icon: Building2, label: 'Properties', path: '/admin/properties' },
  { icon: FileText, label: 'Listings Overview', path: '/admin/listings' },
  { icon: CalendarDays, label: 'Airbnb', path: '/admin/airbnb' },
  { icon: DollarSign, label: 'Revenue', path: '/admin/revenue' },
  { icon: DollarSign, label: 'Payouts', path: '/admin/payouts' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
    navigate('/');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <NavLink to="/" onClick={handleNavClick} className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-foreground">Makazi</span>
            <span className="text-xs text-muted-foreground block">Admin Panel</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
