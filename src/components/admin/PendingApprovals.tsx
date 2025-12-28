import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, MapPin } from 'lucide-react';

interface PendingProperty {
  id: string;
  title: string;
  location: string;
  landlord: string;
  submittedAt: string;
  price: string;
  type: string;
}

const mockPendingProperties: PendingProperty[] = [
  {
    id: '1',
    title: '3 Bedroom Apartment in Kilimani',
    location: 'Kilimani, Nairobi',
    landlord: 'John Kamau',
    submittedAt: '2 hours ago',
    price: 'KES 85,000/mo',
    type: 'Rent'
  },
  {
    id: '2',
    title: 'Modern Villa in Karen',
    location: 'Karen, Nairobi',
    landlord: 'Jane Wanjiku',
    submittedAt: '5 hours ago',
    price: 'KES 45,000,000',
    type: 'Sale'
  },
  {
    id: '3',
    title: 'Beachfront Cottage',
    location: 'Diani, Kwale',
    landlord: 'Peter Ochieng',
    submittedAt: '1 day ago',
    price: 'KES 12,000/night',
    type: 'Airbnb'
  },
];

export function PendingApprovals() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
        <Badge variant="secondary">{mockPendingProperties.length} pending</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockPendingProperties.map((property) => (
          <div 
            key={property.id} 
            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{property.title}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {property.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{property.type}</Badge>
                  <span className="text-sm font-medium text-primary">{property.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  By {property.landlord} • {property.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="text-muted-foreground">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
