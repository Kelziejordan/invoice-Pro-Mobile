import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { RemoteData, remoteIdle, remoteLoading, remoteSuccess, remoteError } from '../types/remote-data';
import { AIAudit, AIAuditSchema, Invoice } from '../schemas/invoice.schema';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

export function useAIAudit() {
  const [auditState, setAuditState] = useState<RemoteData<AIAudit>>(remoteIdle());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const auditInvoice = useCallback(async (invoice: Invoice) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setAuditState(remoteLoading());

    try {
      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          isPerfect: { type: Type.BOOLEAN, description: "True if there are absolutely no warnings or suggestions." },
          warnings: {
            type: Type.ARRAY,
            description: "Critical issues like date mismatches (e.g., 'due on receipt' but due date is far away), missing emails, zero totals, etc.",
            items: { type: Type.STRING }
          },
          suggestions: {
            type: Type.ARRAY,
            description: "Helpful tips for a better invoice (e.g., 'Consider adding payment instructions').",
            items: { type: Type.STRING }
          }
        },
        required: ["isPerfect", "warnings", "suggestions"]
      };

      // Strip out the logo base64 to save tokens and avoid massive payloads
      const { profile, ...restInvoice } = invoice;
      const { logo, ...restProfile } = profile;
      const cleanInvoice = { ...restInvoice, profile: restProfile };

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("The AI audit request timed out. Please try again.")), 30000);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.1-flash-preview',
          contents: `Audit this invoice JSON for logical errors, missing critical business information, or inconsistencies. For example, check if 'due on receipt' matches the due date, if totals make sense, if contact info is missing, etc.\n\nInvoice JSON:\n${JSON.stringify(cleanInvoice, null, 2)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            systemInstruction: "You are an expert accountant and auditor. Review the invoice data and provide warnings for logical errors or missing critical data, and suggestions for improvement. Be concise.",
          }
        }),
        timeoutPromise
      ]);

      if (abortController.signal.aborted) return;

      const responseText = response.text;
      if (!responseText) throw new Error("Received empty response from AI.");

      let parsedJson;
      try {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
        }
        parsedJson = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse AI response:", responseText);
        throw new Error("The AI returned data in an unparseable format.");
      }

      const validationResult = AIAuditSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        console.error("AI Audit validation failed:", validationResult.error);
        throw new Error("The AI returned data in an invalid format.");
      }

      setAuditState(remoteSuccess(validationResult.data));

    } catch (error: unknown) {
      if (abortController.signal.aborted) return;
      console.error("AI Audit Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI audit.";
      setAuditState(remoteError(new Error(errorMessage), { originalError: error }));
    }
  }, []);

  const resetAudit = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAuditState(remoteIdle());
  }, []);

  return {
    auditState,
    auditInvoice,
    resetAudit
  };
}
