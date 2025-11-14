import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface DocumentAnalysisResult {
  extractedText: string;
  summary: string;
  suggestedTags: string[];
  detectedTaskItems?: string[];
  confidence: number;
  documentType: string;
}

/**
 * Analyze an uploaded file using Gemini Vision and other AI capabilities
 */
export async function analyzeUploadedFile(
  fileUrl: string, 
  fileType: string,
  fileName: string
): Promise<DocumentAnalysisResult> {
  try {
    console.log(`Analyzing file: ${fileName} (${fileType})`);
    
    // Check if Gemini API key is available
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      console.warn('⚠️ GEMINI_API_KEY not set in environment variables. Image analysis will be limited.');
      console.warn('💡 To enable full image analysis, set GEMINI_API_KEY in your .env file or environment variables.');
      return {
        extractedText: '',
        summary: `The user has attached an image file: "${fileName}". The image is available but automatic analysis is not configured. Please ask the user to describe what they see in the image so you can help them.`,
        suggestedTags: ['image'],
        detectedTaskItems: [],
        confidence: 0,
        documentType: 'image'
      };
    }
    
    // For images, use Gemini Vision
    if (fileType.startsWith('image/')) {
      return await analyzeImage(fileUrl, fileName, fileType);
    }
    
    // For PDFs, we'll need to extract text first (this would require a PDF parsing library)
    if (fileType === 'application/pdf') {
      return await analyzePDF(fileUrl, fileName);
    }
    
    // For text files, read content directly
    if (fileType.startsWith('text/')) {
      return await analyzeTextFile(fileUrl, fileName);
    }
    
    // For other file types, return basic analysis
    return {
      extractedText: `File: ${fileName}`,
      summary: `Uploaded ${fileType} file: ${fileName}`,
      suggestedTags: ['document', 'upload'],
      confidence: 0.5,
      documentType: fileType
    };
    
  } catch (error) {
    console.error('Error analyzing file:', error);
    return {
      extractedText: '',
      summary: `Error analyzing file: ${fileName}`,
      suggestedTags: ['error'],
      confidence: 0,
      documentType: fileType
    };
  }
}

/**
 * Analyze an image using Gemini Vision
 */
async function analyzeImage(fileUrl: string, fileName: string, mimeType: string = 'image/png'): Promise<DocumentAnalysisResult> {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Fetch the image
    console.log(`Fetching image from: ${fileUrl}`);
    let response: Response;
    try {
      response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });
    } catch (fetchError: any) {
      console.error('Network error fetching image:', fetchError);
      throw new Error(`Network error: ${fetchError?.message || 'Could not fetch image'}`);
    }
    
    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}. Image URL may be invalid or inaccessible.`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.warn(`Warning: Content-Type is ${contentType}, expected image/*`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength === 0) {
      throw new Error('Image file is empty');
    }
    
    console.log(`Image fetched successfully: ${(imageBuffer.byteLength / 1024).toFixed(2)} KB`);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    const imageData = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType || 'image/png'
      }
    };

    const prompt = `
    Analyze this image in detail and provide a comprehensive description. Be specific about:
    1. All visible text (OCR) - transcribe everything you can read
    2. Objects, items, and elements visible in the image
    3. Colors, patterns, and visual details
    4. Context and setting (indoor/outdoor, location clues, etc.)
    5. Any tasks, deadlines, or action items if applicable
    6. Document type if it's a document (receipt, homework, note, screenshot, etc.)
    
    Provide a detailed summary that would help someone understand what's in the image without seeing it.
    
    Respond in JSON format:
    {
      "extractedText": "all visible text from the image",
      "summary": "detailed description of what you see in the image",
      "suggestedTags": ["tag1", "tag2"],
      "detectedTaskItems": ["task1", "task2"],
      "documentType": "type of document or image"
    }
    `;

    console.log(`Calling Gemini Vision API for image: ${fileName} (${(base64Image.length / 1024).toFixed(2)} KB base64)`);
    
    let result;
    try {
      result = await model.generateContent([prompt, imageData]);
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError);
      throw new Error(`Gemini Vision API error: ${apiError?.message || 'Unknown error'}`);
    }
    
    const responseText = result.response.text();
    console.log(`Gemini Vision response received for ${fileName} (${responseText.length} chars)`);
    
    try {
      const analysis = JSON.parse(responseText);
      return {
        extractedText: analysis.extractedText || '',
        summary: analysis.summary || '',
        suggestedTags: analysis.suggestedTags || [],
        detectedTaskItems: analysis.detectedTaskItems || [],
        confidence: 0.8,
        documentType: analysis.documentType || 'image'
      };
    } catch (parseError) {
      // If JSON parsing fails, extract information from text response
      return {
        extractedText: responseText,
        summary: `Image analysis: ${fileName}`,
        suggestedTags: ['image', 'upload'],
        detectedTaskItems: [],
        confidence: 0.6,
        documentType: 'image'
      };
    }
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      fileName,
      fileUrl
    });
    
    // Return a helpful fallback that tells the AI to ask the user
    return {
      extractedText: '',
      summary: `An image was attached (${fileName}), but I couldn't analyze it automatically. The image is available at: ${fileUrl}. Please describe what you see in the image or ask questions about it.`,
      suggestedTags: ['image', 'needs-description'],
      detectedTaskItems: [],
      confidence: 0,
      documentType: 'image'
    };
  }
}

/**
 * Analyze a PDF file (placeholder - would need PDF parsing library)
 */
async function analyzePDF(fileUrl: string, fileName: string): Promise<DocumentAnalysisResult> {
  // This is a placeholder - in a real implementation, you'd use a PDF parsing library
  // like pdf-parse or pdf2pic to extract text first, then analyze with Gemini
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    I have a PDF file named "${fileName}". Since I can't directly read the PDF content,
    please provide a general analysis framework for PDF documents and suggest what
    types of information might be extracted from common PDF types.
    
    Respond with:
    - Common PDF document types
    - Typical content that could be extracted
    - Suggested tags for PDF files
    - Potential task items that might be found in PDFs
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return {
      extractedText: `PDF file: ${fileName}`,
      summary: `PDF document: ${fileName}. ${responseText.substring(0, 200)}...`,
      suggestedTags: ['pdf', 'document', 'upload'],
      detectedTaskItems: [],
      confidence: 0.5,
      documentType: 'pdf'
    };
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    return {
      extractedText: '',
      summary: `Error analyzing PDF: ${fileName}`,
      suggestedTags: ['error'],
      confidence: 0,
      documentType: 'pdf'
    };
  }
}

/**
 * Analyze a text file
 */
async function analyzeTextFile(fileUrl: string, fileName: string): Promise<DocumentAnalysisResult> {
  try {
    // Fetch the text content
    const response = await fetch(fileUrl);
    const textContent = await response.text();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    Analyze this text content and provide:
    1. A summary of the content
    2. Suggested tags
    3. Any tasks, deadlines, or action items mentioned
    4. Document type classification
    
    Text content:
    ${textContent.substring(0, 2000)} ${textContent.length > 2000 ? '...' : ''}
    
    Respond in JSON format:
    {
      "summary": "brief summary",
      "suggestedTags": ["tag1", "tag2"],
      "detectedTaskItems": ["task1", "task2"],
      "documentType": "type of document"
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const analysis = JSON.parse(responseText);
      return {
        extractedText: textContent,
        summary: analysis.summary || '',
        suggestedTags: analysis.suggestedTags || [],
        detectedTaskItems: analysis.detectedTaskItems || [],
        confidence: 0.9,
        documentType: analysis.documentType || 'text'
      };
    } catch (parseError) {
      return {
        extractedText: textContent,
        summary: `Text file: ${fileName}`,
        suggestedTags: ['text', 'document'],
        detectedTaskItems: [],
        confidence: 0.7,
        documentType: 'text'
      };
    }
  } catch (error) {
    console.error('Error analyzing text file:', error);
    return {
      extractedText: '',
      summary: `Error analyzing text file: ${fileName}`,
      suggestedTags: ['error'],
      confidence: 0,
      documentType: 'text'
    };
  }
}

/**
 * Extract structured data from text (dates, names, numbers)
 */
export function extractStructuredData(text: string): {
  dates: string[];
  names: string[];
  numbers: string[];
  emails: string[];
  urls: string[];
} {
  const dates = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi) || [];
  const names = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
  const numbers = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  const urls = text.match(/\b(?:https?:\/\/|www\.)[^\s]+/gi) || [];
  
  return {
    dates: dates.map(d => d.trim()),
    names: names.map(n => n.trim()),
    numbers: numbers.map(n => n.trim()),
    emails: emails.map(e => e.trim()),
    urls: urls.map(u => u.trim())
  };
}

/**
 * Generate smart tags based on content analysis
 */
export function generateSmartTags(
  extractedText: string,
  documentType: string,
  suggestedTags: string[]
): string[] {
  const baseTags = [...suggestedTags];
  
  // Add document type tag
  baseTags.push(documentType);
  
  // Add content-based tags
  const text = extractedText.toLowerCase();
  
  if (text.includes('homework') || text.includes('assignment')) {
    baseTags.push('homework', 'academic');
  }
  
  if (text.includes('meeting') || text.includes('appointment')) {
    baseTags.push('scheduling', 'meeting');
  }
  
  if (text.includes('receipt') || text.includes('invoice')) {
    baseTags.push('financial', 'receipt');
  }
  
  if (text.includes('deadline') || text.includes('due')) {
    baseTags.push('urgent', 'deadline');
  }
  
  if (text.includes('project') || text.includes('task')) {
    baseTags.push('project', 'work');
  }
  
  // Remove duplicates and return
  return [...new Set(baseTags)];
}


