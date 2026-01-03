import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building, Key, Palmtree, Heart, User, Menu, X, Shield, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
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
        <div className="hidden md:flex items-center gap-3">
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
                    <LayoutDashboard className="h-4 w-4" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                
                {(isLandlord || isAdmin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/landlord/add-property" className="flex items-center gap-2 cursor-pointer">
                        <UserCircle className="h-4 w-4" />
                        List Property
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
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

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.to) ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="h-px bg-border my-3" />
            
            {user && (
              <Link to="/dashboard/favorites" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Heart className="h-5 w-5" />
                  Favorites
                </Button>
              </Link>
            )}
            
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Shield className="h-5 w-5" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            
            {(isLandlord || isAdmin) && (
              <Button variant="outline" className="w-full justify-start gap-3">
                <Building className="h-5 w-5" />
                List Property
              </Button>
            )}
            
            {user ? (
              <Button className="w-full justify-start gap-3" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-start gap-3">
                  <User className="h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
