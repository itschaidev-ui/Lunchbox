'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { uploadFile, validateFile, getSupportedFileTypes, getMaxFileSizeMB } from '@/lib/firebase-storage';
import { useAuth } from '@/context/auth-context';
import type { TaskFile } from '@/lib/types';

interface FileUploadProps {
  onFilesUploaded: (files: TaskFile[]) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: TaskFile;
}

export function FileUpload({ onFilesUploaded, maxFiles = 5, className }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card className="border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Sign in to upload files</p>
              <p className="text-xs text-muted-foreground">
                Please sign in to use the file upload feature
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        console.warn(`File ${file.name} is invalid: ${validation.error}`);
      }
      return validation.valid;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Limit number of files
    const filesToUpload = validFiles.slice(0, maxFiles);
    
    // Create uploading file entries
    const newUploadingFiles: UploadingFile[] = filesToUpload.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    for (const uploadingFile of newUploadingFiles) {
      try {
        const result = await uploadFile(uploadingFile.file, user.uid);
        
        if (result.success && result.fileUrl) {
          const taskFile: TaskFile = {
            id: Math.random().toString(36).substr(2, 9),
            taskId: '', // Will be set when task is created
            fileName: result.fileName || uploadingFile.file.name,
            fileType: result.fileType || uploadingFile.file.type,
            fileUrl: result.fileUrl,
            uploadedAt: new Date().toISOString()
          };

          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, status: 'success' as const, result: taskFile }
                : f
            )
          );

          onFilesUploaded([taskFile]);
        } else {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, status: 'error' as const, error: result.error }
                : f
            )
          );
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, status: 'error' as const, error: 'Upload failed' }
              : f
          )
        );
      }
    }
  }, [user, maxFiles, onFilesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const removeUploadingFile = useCallback((id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: {getSupportedFileTypes().join(', ')} (max {getMaxFileSizeMB()}MB)
            </p>
          </div>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getSupportedFileTypes().join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading Files</h4>
          {uploadingFiles.map((uploadingFile) => (
            <Card key={uploadingFile.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadingFile.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadingFile.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uploadingFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {uploadingFile.status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {uploadingFile.status === 'error' && (
                <p className="text-xs text-red-600 mt-1">
                  {uploadingFile.error}
                </p>
              )}
              
              {uploadingFile.status === 'success' && (
                <p className="text-xs text-green-600 mt-1">
                  Upload successful
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


