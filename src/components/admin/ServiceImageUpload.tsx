import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  multiple?: boolean;
  values?: string[];
  onMultiChange?: (urls: string[]) => void;
}

const ServiceImageUpload = ({
  label = "Image",
  value,
  onChange,
  folder = "services",
  multiple = false,
  values = [],
  onMultiChange,
}: ServiceImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("merchant-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("merchant-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      if (multiple && onMultiChange) {
        const urls: string[] = [...values];
        for (const file of Array.from(files)) {
          const url = await uploadFile(file);
          if (url) urls.push(url);
        }
        onMultiChange(urls);
      } else {
        const url = await uploadFile(files[0]);
        if (url) onChange(url);
      }
      toast({ title: "Uploaded", description: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx?: number) => {
    if (multiple && onMultiChange && idx !== undefined) {
      onMultiChange(values.filter((_, i) => i !== idx));
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Single image preview */}
      {!multiple && value && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
          <img src={value} alt="Service" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => removeImage()}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Multiple image previews */}
      {multiple && values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-0.5 right-0.5 h-5 w-5"
                onClick={() => removeImage(i)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
        ) : (
          <><Upload className="h-4 w-4 mr-2" />{value || values.length ? "Change Image" : "Upload Image"}</>
        )}
      </Button>
    </div>
  );
};

export default ServiceImageUpload;
