import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbRoute {
  path: string;
  label: string;
}

interface DashboardBreadcrumbProps {
  basePath: string;
  baseLabel: string;
  routes: BreadcrumbRoute[];
}

export function DashboardBreadcrumb({ basePath, baseLabel, routes }: DashboardBreadcrumbProps) {
  const location = useLocation();

  // Find matching route - check for parameterized paths
  const currentRoute = routes.find(r => {
    if (r.path === location.pathname) return true;
    // Handle dynamic segments like :id
    const routeParts = r.path.split('/');
    const pathParts = location.pathname.split('/');
    if (routeParts.length !== pathParts.length) return false;
    return routeParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
  });

  const isBase = location.pathname === basePath;

  return (
    <Breadcrumb className="mb-4 sm:mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {isBase ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{baseLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={basePath} className="text-muted-foreground hover:text-foreground">
                  {baseLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentRoute && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentRoute.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Pre-configured breadcrumbs for user dashboard
export function UserBreadcrumb() {
  const routes = [
    { path: '/dashboard/bookings', label: 'My Bookings' },
    { path: '/dashboard/bookings/:id', label: 'Booking Details' },
    { path: '/dashboard/messages', label: 'Messages' },
    { path: '/dashboard/inquiries', label: 'My Inquiries' },
    { path: '/dashboard/favorites', label: 'Saved Properties' },
  ];

  return <DashboardBreadcrumb basePath="/dashboard" baseLabel="My Profile" routes={routes} />;
}

// Pre-configured breadcrumbs for landlord portal
export function LandlordBreadcrumb() {
  const routes = [
    { path: '/landlord/properties', label: 'My Properties' },
    { path: '/landlord/add-property', label: 'Add Property' },
    { path: '/landlord/edit-property/:id', label: 'Edit Property' },
    { path: '/landlord/airbnb-bookings', label: 'Airbnb Bookings' },
    { path: '/landlord/airbnb-bookings/:id', label: 'Booking Details' },
    { path: '/landlord/messages', label: 'Messages' },
    { path: '/landlord/inquiries', label: 'Inquiries' },
  ];

  return <DashboardBreadcrumb basePath="/landlord" baseLabel="Dashboard" routes={routes} />;
}
