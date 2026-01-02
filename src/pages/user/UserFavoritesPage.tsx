import { UserLayout } from '@/components/user/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserFavoritesPage() {
  return (
    <UserLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Saved Properties</h1>
          <p className="text-muted-foreground mt-1">Properties you've saved for later</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Saved Properties</h3>
            <p className="text-muted-foreground mb-4">
              When you save properties, they'll appear here for quick access.
            </p>
            <Link to="/">
              <Button>Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
