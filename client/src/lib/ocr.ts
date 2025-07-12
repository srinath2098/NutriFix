// Mistral Vision API integration for blood test text extraction

export interface OCRProgress {
  status: 'idle' | 'loading' | 'recognizing' | 'success' | 'error';
  progress: number;
  message: string;
}

export async function extractTextWithMistral(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a JPG or PNG file.');
  }

  // Validate file size (max 20MB - Mistral limit)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('File is too large. Maximum size is 20MB.');
  }

  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('Mistral API key is missing. Please add VITE_MISTRAL_API_KEY to your environment variables.');
  }

  onProgress?.({
    status: 'loading',
    progress: 10,
    message: 'Converting image to base64...'
  });

  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  onProgress?.({
    status: 'recognizing',
    progress: 50,
    message: 'Sending to Mistral Vision API...'
  });

  // Call Mistral Vision API
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this blood test report image. Return only the raw text content without any formatting or analysis. Include all numerical values, test names, reference ranges, and any other visible text.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Mistral API failed: ${errorMessage}`);
  }

  onProgress?.({
    status: 'recognizing',
    progress: 80,
    message: 'Processing OCR results...'
  });

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content;
  
  if (!extractedText) {
    throw new Error('No text could be extracted from the image. Please ensure the image is clear and contains readable text.');
  }

  onProgress?.({
    status: 'success',
    progress: 100,
    message: 'Text extraction complete!'
  });

  return extractedText;
}

// Default export uses Mistral Vision API
export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  return extractTextWithMistral(file, onProgress);
}
