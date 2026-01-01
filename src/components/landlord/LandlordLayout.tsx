import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LandlordSidebar } from './LandlordSidebar';
import { Loader2 } from 'lucide-react';

interface LandlordLayoutProps {
  children: ReactNode;
}

export function LandlordLayout({ children }: LandlordLayoutProps) {
  const { user, loading, isLandlord, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Allow both landlords and admins to access landlord dashboard
  if (!isLandlord && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <LandlordSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
