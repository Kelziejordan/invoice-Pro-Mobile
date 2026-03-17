// filepath: src/hooks/useAIAssistant.ts
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { RemoteData } from '../types/remote-data';
import { AIInvoiceExtractionSchema, AIInvoiceExtraction } from '../schemas/invoice.schema';

export function useAIAssistant() {
  const [state, setState] = useState<RemoteData<AIInvoiceExtraction>>(RemoteData.idle());
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractInvoiceData = useCallback(async (prompt: string) => {
    // Abort previous request if in-flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState(RemoteData.loading());

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Build the prompt instruction
      const systemInstruction = `
        You are an expert invoice data extractor. 
        Extract the client name, client address, tax rate (as a percentage number, e.g., 10 for 10%), and a list of line items from the user's natural language input.
        Each line item should have a description, quantity, unitPrice, and optionally 'details' (which are comments or scope of work).
        If a quantity is not specified, assume 1.
        If a unit price is not specified, try to infer it or leave it as 0.
      `;

      // The Gemini API call (we simulate passing the signal if the SDK doesn't natively support it, 
      // but we check signal.aborted after the await)
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clientName: { type: Type.STRING },
              clientAddress: { type: Type.STRING },
              taxRate: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    details: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                  },
                  required: ['description', 'quantity', 'unitPrice'],
                },
              },
            },
            required: ['clientName', 'items'],
          },
        },
      });

      if (abortController.signal.aborted) {
        return; // Ignore if aborted
      }

      const jsonStr = response.text?.trim() || '{}';
      const parsedJson = JSON.parse(jsonStr);
      
      // Strict validation boundary
      const validationResult = AIInvoiceExtractionSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        throw new Error('AI returned malformed data that failed schema validation.');
      }

      setState(RemoteData.success(validationResult.data));
    } catch (error: any) {
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log('AI request aborted');
        return;
      }
      console.error('AI Extraction Error:', error);
      setState(RemoteData.error(error instanceof Error ? error : new Error(String(error))));
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(RemoteData.idle());
  }, []);

  return { state, extractInvoiceData, reset };
}
