import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { RemoteData, remoteIdle, remoteLoading, remoteSuccess, remoteError } from '../types/remote-data';
import { AIInvoiceExtraction, AIInvoiceExtractionSchema } from '../schemas/invoice.schema';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

export function usePhotoWizard() {
  const [state, setState] = useState<RemoteData<AIInvoiceExtraction>>(remoteIdle());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const extractFromPhoto = useCallback(async (base64Image: string, mimeType: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState(remoteLoading());

    try {
      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          clientName: { type: Type.STRING, description: "The name of the client or customer." },
          clientAddress: { type: Type.STRING, description: "The physical address of the client." },
          jobNumber: { type: Type.STRING, description: "The job number or reference number if mentioned." },
          taxRate: { type: Type.NUMBER, description: "The tax rate percentage to apply (e.g., 5 for 5%). Return 0 if not mentioned." },
          items: {
            type: Type.ARRAY,
            description: "The list of services or products provided.",
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "Short title of the service/product." },
                details: { type: Type.STRING, description: "Additional details or scope of work." },
                quantity: { type: Type.NUMBER, description: "Quantity or hours. Default to 1 if not specified." },
                unitPrice: { type: Type.NUMBER, description: "Price per unit or total price if quantity is 1." }
              },
              required: ["description", "quantity", "unitPrice"]
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image, // Remove data URI prefix if present
                mimeType: mimeType,
              },
            },
            {
              text: "Extract invoice details from this image. If a detail is missing, omit it or use logical defaults (like 1 for quantity).",
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          systemInstruction: "You are a highly accurate data extraction assistant for an invoicing application. Extract the requested fields strictly based on the provided image. IMPORTANT FORMATTING RULES: Ensure all text is formatted perfectly as if it were a legal document. Capitalize postal codes properly with a space (e.g., 'T5R 1K1'). Ensure locations have proper commas between city and province/state (e.g., 'Edmonton, Alberta').",
        }
      });

      if (abortController.signal.aborted) return;

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from AI.");
      }

      const parsedJson = JSON.parse(responseText);
      const validationResult = AIInvoiceExtractionSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        console.error("AI Data Validation Failed:", validationResult.error);
        throw new Error("The AI returned data in an invalid format.");
      }

      setState(remoteSuccess(validationResult.data));

    } catch (error: unknown) {
      if (abortController.signal.aborted) return;
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI extraction.";
      setState(remoteError(new Error(errorMessage), { originalError: error }));
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(remoteIdle());
  }, []);

  return {
    state,
    extractFromPhoto,
    reset
  };
}
