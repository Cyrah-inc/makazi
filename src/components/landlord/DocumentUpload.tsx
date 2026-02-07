import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  documents: string[];
  onDocumentsChange: (docs: string[]) => void;
  maxDocuments?: number;
  disabled?: boolean;
}

export function DocumentUpload({ documents, onDocumentsChange, maxDocuments = 5, disabled }: DocumentUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    const remaining = maxDocuments - documents.length;
    if (remaining <= 0) {
      toast({ title: 'Limit reached', description: `Maximum ${maxDocuments} documents allowed`, variant: 'destructive' });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);

    const newUrls: string[] = [];
    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
        toast({ title: 'Invalid file', description: `${file.name} is not a supported format (PDF, JPG, PNG)`, variant: 'destructive' });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 10MB limit`, variant: 'destructive' });
        continue;
      }

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('landlord-documents').upload(filePath, file);
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        continue;
      }

      const { data: urlData } = supabase.storage.from('landlord-documents').getPublicUrl(filePath);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      onDocumentsChange([...documents, ...newUrls]);
    }
    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = async (url: string) => {
    // Extract path from URL
    const bucketUrl = supabase.storage.from('landlord-documents').getPublicUrl('').data.publicUrl;
    const path = url.replace(bucketUrl, '');
    
    await supabase.storage.from('landlord-documents').remove([path]);
    onDocumentsChange(documents.filter(d => d !== url));
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png)$/i)) return <Image className="w-5 h-5 text-primary" />;
    return <FileText className="w-5 h-5 text-accent" />;
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    // Remove timestamp prefix
    return name.replace(/^\d+-/, '');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((url, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              {url.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={url} alt="Document" className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  {getFileIcon(url)}
                </div>
              )}
              <span className="text-sm truncate flex-1">{getFileName(url)}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(url)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {documents.length < maxDocuments && !disabled && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Document ({documents.length}/{maxDocuments})</>
          )}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted: PDF, JPG, PNG (max 10MB each)
      </p>
    </div>
  );
}
