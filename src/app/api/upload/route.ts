import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, validateFile } from '@/lib/firebase-storage';
import { analyzeUploadedFile } from '@/lib/ai/document-analyzer';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UploadRequest {
  file: File;
  userId: string;
  taskId?: string;
}

interface UploadResponse {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  analysis?: {
    extractedText: string;
    summary: string;
    suggestedTags: string[];
    detectedTaskItems?: string[];
    confidence: number;
    documentType: string;
  };
  error?: string;
}

/**
 * POST /api/upload
 * Handle file uploads and trigger AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const taskId = formData.get('taskId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload file to Firebase Storage
    const uploadResult = await uploadFile(file, userId);
    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // Analyze the uploaded file
    let analysis = null;
    try {
      const analysisResult = await analyzeUploadedFile(
        uploadResult.fileUrl!,
        uploadResult.fileType!,
        file.name
      );
      
      analysis = {
        extractedText: analysisResult.extractedText,
        summary: analysisResult.summary,
        suggestedTags: analysisResult.suggestedTags,
        detectedTaskItems: analysisResult.detectedTaskItems,
        confidence: analysisResult.confidence,
        documentType: analysisResult.documentType
      };
    } catch (analysisError) {
      console.error('Error analyzing file:', analysisError);
      // Continue without analysis - file upload was successful
    }

    // Store file metadata in Firestore
    let fileId: string;
    try {
      const fileData = {
        userId,
        taskId: taskId || null,
        fileName: file.name,
        fileType: uploadResult.fileType,
        fileUrl: uploadResult.fileUrl,
        uploadedAt: new Date().toISOString(),
        extractedText: analysis?.extractedText || null,
        summary: analysis?.summary || null,
        suggestedTags: analysis?.suggestedTags || [],
        confidence: analysis?.confidence || 0,
        documentType: analysis?.documentType || uploadResult.fileType,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'task_files'), fileData);
      fileId = docRef.id;
    } catch (firestoreError) {
      console.error('Error storing file metadata:', firestoreError);
      // File upload was successful, but metadata storage failed
      return NextResponse.json({
        success: true,
        fileUrl: uploadResult.fileUrl,
        analysis,
        warning: 'File uploaded but metadata not saved'
      });
    }

    const response: UploadResponse = {
      success: true,
      fileId,
      fileUrl: uploadResult.fileUrl,
      analysis
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Get upload configuration and limits
 */
export async function GET() {
  try {
    return NextResponse.json({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      features: {
        ocr: true,
        textExtraction: true,
        aiAnalysis: true,
        autoTagging: true
      }
    });
  } catch (error) {
    console.error('Error in upload config API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


