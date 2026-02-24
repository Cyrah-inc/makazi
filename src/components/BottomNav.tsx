import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/useUnreadCount';

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
  const unreadCount = useUnreadCount();

  // Don't render on desktop or in admin/landlord pages (they have their own nav)
  // Keep visible on /dashboard/* so users can access Saved and Chats
  const isHiddenPage = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/landlord');
  
  if (!isMobile || isHiddenPage) return null;

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
              <div className="relative">
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                {item.label === 'Chats' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
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
