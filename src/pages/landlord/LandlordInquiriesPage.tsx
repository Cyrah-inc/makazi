import { LandlordLayout } from '@/components/landlord/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function LandlordInquiriesPage() {
  return (
    <LandlordLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Inquiries</h1>
          <p className="text-muted-foreground mt-1">View and respond to property inquiries</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Inquiries Yet</h3>
            <p className="text-muted-foreground">
              When potential tenants or buyers inquire about your properties, you'll see them here.
            </p>
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}
