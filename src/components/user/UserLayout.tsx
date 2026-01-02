import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserSidebar } from './UserSidebar';
import { Loader2 } from 'lucide-react';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-screen flex bg-muted/30">
      <UserSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
