import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ImageIcon, Star, Video } from 'lucide-react';

interface PropertyImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  userId: string;
  maxImages?: number;
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.quicktime'];
const isVideoUrl = (url: string) => VIDEO_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));

export function PropertyImageUpload({ 
  images, 
  onImagesChange, 
  userId, 
  maxImages = 10 
}: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({ title: 'Maximum files reached', description: `You can only upload up to ${maxImages} files`, variant: 'destructive' });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = filesToUpload.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({ title: 'Invalid file type', description: 'Only JPEG, PNG, WebP, and GIF images are allowed', variant: 'destructive' });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = filesToUpload.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({ title: 'File too large', description: 'Each image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const results = await Promise.all(filesToUpload.map(uploadFile));
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length > 0) {
      onImagesChange([...images, ...successfulUrls]);
      toast({ title: 'Images uploaded', description: `${successfulUrls.length} image(s) uploaded successfully` });
    }
    if (successfulUrls.length < filesToUpload.length) {
      toast({ title: 'Some uploads failed', description: `${filesToUpload.length - successfulUrls.length} image(s) failed to upload`, variant: 'destructive' });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({ title: 'Maximum files reached', description: `You can only upload up to ${maxImages} files`, variant: 'destructive' });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const invalidFiles = filesToUpload.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({ title: 'Invalid file type', description: 'Only MP4, WebM, and MOV videos are allowed', variant: 'destructive' });
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = filesToUpload.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({ title: 'File too large', description: 'Each video must be less than 50MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const results = await Promise.all(filesToUpload.map(uploadFile));
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length > 0) {
      onImagesChange([...images, ...successfulUrls]);
      toast({ title: 'Videos uploaded', description: `${successfulUrls.length} video(s) uploaded successfully` });
    }
    if (successfulUrls.length < filesToUpload.length) {
      toast({ title: 'Some uploads failed', description: `${filesToUpload.length - successfulUrls.length} video(s) failed to upload`, variant: 'destructive' });
    }

    setUploading(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeFile = async (index: number) => {
    const imageUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/property-images/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('property-images').remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onImagesChange(newImages);
    toast({ title: 'Cover photo updated', description: 'This image is now the cover photo' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageSelect} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={handleVideoSelect} className="hidden" />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading || images.length >= maxImages}>
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Upload Images</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploading || images.length >= maxImages}>
          <Video className="w-4 h-4 mr-2" />Upload Video
        </Button>
        <span className="text-sm text-muted-foreground">{images.length}/{maxImages} files</span>
      </div>

      {images.length === 0 ? (
        <div 
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Click to upload property images or videos</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Images: JPEG, PNG, WebP, GIF (5MB) · Videos: MP4, WebM, MOV (50MB)</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => {
            const isVideo = isVideoUrl(url);
            return (
              <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border">
                {isVideo ? (
                  <video src={url} preload="metadata" playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt={`Property image ${index + 1}`} loading="lazy" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded flex items-center gap-1">
                    <Star className="w-3 h-3" /> Cover
                  </span>
                )}
                {index !== 0 && !isVideo && (
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    className="absolute bottom-2 left-2 px-2 py-1 bg-background/90 text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Set as Cover
                  </button>
                )}
                {isVideo && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-background/80 text-foreground text-xs rounded flex items-center gap-1">
                    <Video className="w-3 h-3" /> Video
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
