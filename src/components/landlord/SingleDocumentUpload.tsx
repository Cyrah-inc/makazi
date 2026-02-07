import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image, Loader2, CheckCircle } from 'lucide-react';

interface SingleDocumentUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function SingleDocumentUpload({ label, value, onChange, disabled }: SingleDocumentUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
      toast({ title: 'Invalid file', description: 'Only PDF, JPG, PNG files are supported', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('landlord-documents').upload(filePath, file);

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('landlord-documents').getPublicUrl(filePath);
    onChange(urlData.publicUrl);
    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = async () => {
    if (!value) return;
    const bucketUrl = supabase.storage.from('landlord-documents').getPublicUrl('').data.publicUrl;
    const path = value.replace(bucketUrl, '');
    await supabase.storage.from('landlord-documents').remove([path]);
    onChange(null);
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace(/^\d+-/, '');
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png)$/i.test(url);

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          {isImage(value) ? (
            <img src={value} alt="Document" className="w-10 h-10 rounded object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getFileName(value)}</p>
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Uploaded
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed gap-2 h-auto py-3"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> {label}</>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 10MB)</p>
    </div>
  );
}
