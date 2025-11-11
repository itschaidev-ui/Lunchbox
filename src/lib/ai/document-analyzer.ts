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
    
    // For images, use Gemini Vision
    if (fileType.startsWith('image/')) {
      return await analyzeImage(fileUrl, fileName);
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
async function analyzeImage(fileUrl: string, fileName: string): Promise<DocumentAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Fetch the image
    const response = await fetch(fileUrl);
    const imageBuffer = await response.arrayBuffer();
    const imageData = {
      inlineData: {
        data: Buffer.from(imageBuffer).toString('base64'),
        mimeType: 'image/jpeg' // Assume JPEG for now
      }
    };

    const prompt = `
    Analyze this image and provide:
    1. Extract all visible text (OCR)
    2. Summarize the content
    3. Suggest relevant tags
    4. Identify any tasks, deadlines, or action items
    5. Determine document type (receipt, homework, note, etc.)
    
    Respond in JSON format:
    {
      "extractedText": "all visible text",
      "summary": "brief summary of content",
      "suggestedTags": ["tag1", "tag2"],
      "detectedTaskItems": ["task1", "task2"],
      "documentType": "type of document"
    }
    `;

    const result = await model.generateContent([prompt, imageData]);
    const responseText = result.response.text();
    
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
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      extractedText: '',
      summary: `Error analyzing image: ${fileName}`,
      suggestedTags: ['error'],
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


