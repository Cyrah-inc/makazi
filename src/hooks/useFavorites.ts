import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchFavorites = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data.map((f) => f.property_id));
    }
    setLoading(false);
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  const toggleFavorite = async (propertyId: string) => {
    if (!user?.id) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save properties',
        variant: 'destructive',
      });
      return;
    }

    const isFav = isFavorite(propertyId);

    if (isFav) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove from favorites',
          variant: 'destructive',
        });
      } else {
        setFavorites((prev) => prev.filter((id) => id !== propertyId));
        toast({
          title: 'Removed from favorites',
          description: 'Property removed from your saved list',
        });
      }
    } else {
      // Add to favorites
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        property_id: propertyId,
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add to favorites',
          variant: 'destructive',
        });
      } else {
        setFavorites((prev) => [...prev, propertyId]);
        toast({
          title: 'Added to favorites',
          description: 'Property saved to your favorites',
        });
      }
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}
