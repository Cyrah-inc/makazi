import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Loader2, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { useToast } from '@/hooks/use-toast';

interface OptimizationResult {
  propertyTitle: string;
  originalCount: number;
  optimizedCount: number;
  savedBytes: number;
}

export function BulkImageOptimizer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProperty, setCurrentProperty] = useState('');
  const [results, setResults] = useState<OptimizationResult[]>([]);

  const { data: properties } = useQuery({
    queryKey: ['landlord-properties-images', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, images')
        .eq('landlord_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalImages = properties?.reduce((sum, p) => sum + (p.images?.length || 0), 0) || 0;
  const propertiesWithImages = properties?.filter(p => (p.images?.length || 0) > 0) || [];

  const optimizeAll = async () => {
    if (!properties || propertiesWithImages.length === 0) return;
    setIsOptimizing(true);
    setResults([]);
    setProgress(0);

    let processedImages = 0;
    const newResults: OptimizationResult[] = [];

    for (const property of propertiesWithImages) {
      const images = property.images || [];
      if (images.length === 0) continue;

      setCurrentProperty(property.title);
      let optimizedCount = 0;
      let savedBytes = 0;
      const newUrls = [...images];

      for (let i = 0; i < images.length; i++) {
        const url = images[i];
        // Skip videos
        if (/\.(mp4|webm|mov)$/i.test(url)) {
          processedImages++;
          setProgress(Math.round((processedImages / totalImages) * 100));
          continue;
        }
        // Skip already-webp images (likely already compressed)
        if (/\.webp$/i.test(url)) {
          processedImages++;
          setProgress(Math.round((processedImages / totalImages) * 100));
          continue;
        }

        try {
          // Download the image
          const response = await fetch(url);
          if (!response.ok) {
            processedImages++;
            setProgress(Math.round((processedImages / totalImages) * 100));
            continue;
          }
          const blob = await response.blob();
          const originalFile = new File([blob], `image.${url.split('.').pop()}`, { type: blob.type });

          // Compress
          const compressed = await compressImage(originalFile);

          // Only re-upload if compression saved space
          if (compressed !== originalFile && compressed.size < originalFile.size) {
            const saving = originalFile.size - compressed.size;
            const fileExt = compressed.name.split('.').pop();
            const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, compressed);

            if (!uploadError) {
              const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
              newUrls[i] = data.publicUrl;
              optimizedCount++;
              savedBytes += saving;

              // Try to delete old file
              try {
                const oldUrl = new URL(url);
                const pathParts = oldUrl.pathname.split('/property-images/');
                if (pathParts.length > 1) {
                  await supabase.storage.from('property-images').remove([pathParts[1]]);
                }
              } catch {}
            }
          }
        } catch (err) {
          console.error(`Failed to optimize image for ${property.title}:`, err);
        }

        processedImages++;
        setProgress(Math.round((processedImages / totalImages) * 100));
      }

      // Update property with new URLs if any changed
      if (optimizedCount > 0) {
        await supabase
          .from('properties')
          .update({ images: newUrls })
          .eq('id', property.id);

        newResults.push({
          propertyTitle: property.title,
          originalCount: images.length,
          optimizedCount,
          savedBytes,
        });
      }
    }

    setResults(newResults);
    setIsOptimizing(false);
    setCurrentProperty('');
    setProgress(100);

    queryClient.invalidateQueries({ queryKey: ['landlord-properties'] });

    const totalSaved = newResults.reduce((s, r) => s + r.savedBytes, 0);
    const totalOptimized = newResults.reduce((s, r) => s + r.optimizedCount, 0);

    if (totalOptimized > 0) {
      toast({
        title: 'Optimization complete',
        description: `${totalOptimized} images optimized, ${formatBytes(totalSaved)} saved`,
      });
    } else {
      toast({
        title: 'All images are already optimized',
        description: 'No further compression was possible.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-primary" />
          Bulk Image Optimizer
        </CardTitle>
        <CardDescription>
          Re-compress existing property images to WebP format for faster loading times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{totalImages} images across {propertiesWithImages.length} properties</span>
          </div>
        </div>

        {isOptimizing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Optimizing: {currentProperty} ({progress}%)
            </p>
          </div>
        )}

        {results.length > 0 && !isOptimizing && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  {r.propertyTitle}
                </span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {r.optimizedCount} images · {formatBytes(r.savedBytes)} saved
                </Badge>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={optimizeAll}
          disabled={isOptimizing || propertiesWithImages.length === 0}
          className="w-full"
        >
          {isOptimizing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Optimizing...</>
          ) : (
            <><Zap className="h-4 w-4 mr-2" />Optimize All Images</>
          )}
        </Button>

        {propertiesWithImages.length === 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            No properties with images found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
