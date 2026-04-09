import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { RemoteData, remoteIdle, remoteLoading, remoteSuccess, remoteError } from '../types/remote-data';
import { AIInvoiceExtraction, AIInvoiceExtractionSchema } from '../schemas/invoice.schema';

// Initialize the Gemini API client
// Note: In a real production app, this should ideally be called from a backend to protect the API key.
// For this local-first SPA, we rely on the environment variable injected by the build process.
const getAIClient = () => {
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || '';
  } catch (e) {
    // Ignore
  }
  if (!apiKey) {
    try {
      apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    } catch (e) {
      // Ignore
    }
  }
  return new GoogleGenAI({ apiKey });
};

export function useAIAssistant() {
  const aiRef = useRef<GoogleGenAI | null>(null);
  const [state, setState] = useState<RemoteData<AIInvoiceExtraction>>(remoteIdle());
  const abortControllerRef = useRef<AbortController | null>(null);

  const getAI = () => {
    if (!aiRef.current) {
      aiRef.current = getAIClient();
    }
    return aiRef.current;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const extractInvoiceData = useCallback(async (prompt: string) => {
    // Abort any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState(remoteLoading());

    try {
      // Define the expected schema for the Gemini API
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

      const response = await getAI().models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Extract invoice details from the following text. If a detail is missing, omit it or use logical defaults (like 1 for quantity).\n\nText: "${prompt}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          systemInstruction: "You are a highly accurate data extraction assistant for an invoicing application. Extract the requested fields strictly based on the user's input. IMPORTANT FORMATTING RULES: Ensure all text is formatted perfectly as if it were a legal document. Capitalize postal codes properly with a space (e.g., 'T5R 1K1'). Ensure locations have proper commas between city and province/state (e.g., 'Edmonton, Alberta'). Fix any obvious grammatical errors in the user's input.",
        }
      });

      // Check if aborted before updating state
      if (abortController.signal.aborted) return;

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from AI.");
      }

      const parsedJson = JSON.parse(responseText);
      
      // Mandate 8: Zero-Trust Data Boundaries (Validate AI output)
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
    extractInvoiceData,
    reset
  };
}
