// Simple Tesseract.js OCR integration for client-side blood test extraction
import { createWorker, createScheduler, RecognizeOptions, Worker } from 'tesseract.js';
import { parseBloodTestText } from '@/utils/bloodTestParser';
import { api } from '@/lib/api';

// Type for Tesseract worker instance
let worker: Worker | undefined;

export interface OCRProgress {
  status: 'idle' | 'loading' | 'recognizing' | 'success' | 'error';
  progress: number;
  message: string;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a JPG or PNG file. PDF support coming soon!');
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }

  try {
    // Initialize Tesseract worker with local resources
    const scheduler = createScheduler();
    worker = await createWorker('eng', 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: m => {
        if (onProgress) {
          const percent = 20 + (m.progress * 80);
          onProgress({
            status: m.status === 'recognizing text' ? 'recognizing' : 'loading',
            progress: Math.round(percent),
            message: m.status === 'recognizing text' ? 'Reading test results...' : 'Processing image...'
          });
        }
      }
    });
    scheduler.addWorker(worker);
    
    onProgress?.({
      status: 'loading',
      progress: 20,
      message: 'Initializing text recognition...'
    });

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as data URL'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown error occurred'));
      }
    });

    // Recognize text
    const result = await scheduler.addJob('recognize', base64Data, {
      tessedit_pageseg_mode: 6, // Single uniform block of text
      preserve_interword_spaces: 1, // Preserve spaces between words
      preserve_interline_spaces: 1, // Preserve spaces between lines
      preserve_blank_lines: 1, // Preserve blank lines
      preserve_layout: 1 // Preserve the layout of the text
    } as Partial<RecognizeOptions>);

    // Clean up worker
    if (worker) {
      await worker.terminate();
    }
    worker = undefined;
    await scheduler.terminate();

    const text = result.data.text.trim();
    
    // Parse the text into structured nutrient data
    const nutrients = parseBloodTestText(text);
    
    // Save the data to the database
    const response = await api.post('/api/blood-tests', {
      testDate: new Date().toISOString(),
      nutrients: nutrients
    }).catch((error) => {
      throw new Error('Failed to save blood test results: ' + error.message);
    });
    
    onProgress?.({
      status: 'success',
      progress: 100,
      message: 'Text extraction complete!'
    });

    return text;
  } catch (err) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message: err instanceof Error ? err.message : 'Failed to process image'
    });
    throw err;
  } finally {
    // Ensure worker is terminated even if there's an error
    if (worker) {
      await worker.terminate();
    }
    worker = undefined;
  }
}
