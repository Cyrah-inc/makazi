import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        
        if (error) {
          console.error('Error fetching maps key:', error);
          setError('Failed to load Google Maps');
          return;
        }
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('Google Maps API key not available');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load Google Maps');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, isLoading, error };
};
