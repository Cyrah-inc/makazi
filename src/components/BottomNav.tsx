import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/rent', icon: Search, label: 'Browse', matchPaths: ['/rent', '/buy', '/airbnb'] },
  { href: '/dashboard/favorites', icon: Heart, label: 'Saved', requiresAuth: true },
  { href: '/dashboard/chats', icon: MessageSquare, label: 'Chats', requiresAuth: true },
  { href: '/dashboard', icon: User, label: 'Profile', requiresAuth: true },
];

function BottomNavInner() {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Don't render on desktop or in dashboard pages (they have their own nav)
  const isDashboardPage = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/landlord');
  
  if (!isMobile || isDashboardPage) return null;

  const filteredItems = navItems.filter(item => !item.requiresAuth || user);

  // If not logged in, show auth link instead of profile
  const displayItems = user 
    ? filteredItems 
    : [...navItems.filter(item => !item.requiresAuth), { href: '/auth', icon: User, label: 'Sign In' }];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {displayItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href)) ||
                          ('matchPaths' in item && item.matchPaths?.some(p => location.pathname.startsWith(p)));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomNav = memo(BottomNavInner);
