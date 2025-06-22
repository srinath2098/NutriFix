import { describe, beforeEach, it, expect, vi } from 'vitest';
import { extractTextFromFile } from '../lib/ocr';
import { OCRProgress } from '../lib/ocr';
import { TEST_IMAGE_BASE64 } from './test-image-base64';

// Mock FileReader
global.FileReader = class MockFileReader {
  onload: (event: Event) => void;
  onerror: (event: Event) => void;
  result: string | ArrayBuffer | null = null;

  static EMPTY = 0;
  static LOADING = 1;
  static DONE = 2;

  readAsDataURL(blob: Blob) {
    this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    if (this.onload) {
      this.onload(new Event('load'));
    }
  }
} as unknown as typeof FileReader;

// Mock localStorage
global.localStorage = {
  length: 0,
  key: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as unknown as Storage;

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: 'test-id' })
});

describe('OCR Text Extraction', () => {
  let progressUpdates: OCRProgress[] = [];

  const mockProgressCallback = (progress: OCRProgress) => {
    progressUpdates.push(progress);
  };

  beforeEach(() => {
    progressUpdates = [];
  });

  it('should extract text from blood test image', async () => {
    // Create a small test image with base64 data
    const base64Image = TEST_IMAGE_BASE64;
    const blob = new Blob([base64Image], { type: 'image/png' });
    const file = new File([blob], 'test-image.png', { type: 'image/png' });

    const result = await extractTextFromFile(file, mockProgressCallback);

    expect(result).toBeTruthy();
    expect(progressUpdates).toHaveLength(4); // idle, loading, recognizing, success
    expect(progressUpdates[0].status).toBe('loading');
    expect(progressUpdates[0].progress).toBe(20);
    expect(progressUpdates[1].status).toBe('recognizing');
    expect(progressUpdates[2].status).toBe('recognizing');
    expect(progressUpdates[3].status).toBe('success');
    expect(progressUpdates[3].progress).toBe(100);
  });

  it('should handle invalid file type', async () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await expect(extractTextFromFile(file)).rejects.toThrow('Please upload a JPG or PNG file. PDF support coming soon!');
  });

  it('should handle large file', async () => {
    // Create a 11MB file
    const largeFile = new File([''.padEnd(1024 * 1024 * 11, 'a')], 'large.png', { type: 'image/png' });

    await expect(extractTextFromFile(largeFile)).rejects.toThrow('File is too large. Maximum size is 10MB.');
  });
});
