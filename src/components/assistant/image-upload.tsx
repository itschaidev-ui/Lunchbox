'use client';

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ onImagesChange, maxImages = 4, className }: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the max
    if (images.length + files.length > maxImages) {
      toast({
        title: 'Too many images',
        description: `You can only upload up to ${maxImages} images at a time.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadedImages: UploadedImage[] = [];

      for (const file of validFiles) {
        // Create a unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomId}_${file.name}`;
        
        // Upload to Firebase Storage
        const storageRef = ref(
          storage,
          `chat-images/${user?.uid || 'anonymous'}/${fileName}`
        );
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedImages.push({
          id: randomId,
          url: downloadURL,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onImagesChange(newImages);

      toast({
        title: 'Images uploaded',
        description: `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-600"
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={uploading}
          className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Image ({images.length}/{maxImages})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

