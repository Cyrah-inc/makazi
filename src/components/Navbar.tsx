import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building, Key, Palmtree, Heart, User, Menu, X, Shield, LogOut, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isLandlord, signOut } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/buy', label: 'Buy', icon: Building },
    { to: '/rent', label: 'Rent', icon: Key },
    { to: '/airbnb', label: 'Airbnb', icon: Palmtree },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const MobileNavLink = ({ to, icon: Icon, label, variant = 'ghost' }: { to: string; icon: React.ElementType; label: string; variant?: 'ghost' | 'default' | 'outline' }) => (
    <Link to={to} onClick={() => setMobileMenuOpen(false)}>
      <Button
        variant={isActive(to) ? 'secondary' : variant}
        className="w-full justify-between gap-3 h-12"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Button>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Building className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg leading-none text-foreground">
              Makazi
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Kenya Property
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive(link.to) ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'gap-2',
                  isActive(link.to) && 'shadow-none'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <Link to="/dashboard/favorites">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{isAdmin ? 'Admin' : isLandlord ? 'Landlord' : 'User'}</p>
                </div>
                <DropdownMenuSeparator />
                
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {(isLandlord || isAdmin) && (
                  <DropdownMenuItem asChild>
                    <Link to="/landlord" className="flex items-center gap-2 cursor-pointer">
                      <Building className="h-4 w-4" />
                      Landlord Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-border shrink-0">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col flex-1 min-h-0">
              {/* User Info */}
              {user && (
                <div className="p-4 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {isAdmin ? 'Admin' : isLandlord ? 'Landlord' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Browse Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Browse</h3>
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <MobileNavLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
                    ))}
                  </div>
                </div>

                {/* My Account Section - Only for logged in users */}
                {user && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">My Account</h3>
                    <div className="space-y-1">
                      <MobileNavLink to="/dashboard" icon={User} label="My Profile" />
                      <MobileNavLink to="/dashboard/favorites" icon={Heart} label="My Favorites" />
                    </div>
                  </div>
                )}

                {/* Landlord Section */}
                {(isLandlord || isAdmin) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Landlord</h3>
                    <div className="space-y-1">
                      <MobileNavLink to="/landlord" icon={Building} label="Landlord Dashboard" />
                    </div>
                  </div>
                )}

                {/* Admin Section */}
                {isAdmin && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Administration</h3>
                    <div className="space-y-1">
                      <MobileNavLink to="/admin" icon={Shield} label="Admin Panel" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border bg-background space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-start gap-3 h-12">
                      <User className="h-5 w-5" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default Navbar;
