import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const metaEnv = (import.meta as any).env;
    const apiKey = metaEnv?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

export async function generateCallSummary(
  customerName: string,
  product: string,
  status: string,
  agentNotes: string
): Promise<string> {
  try {
    const client = getAiClient();
    if (client) {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a concise 2-sentence CRM call log summary for field sales agent. 
Customer Name: ${customerName}
Product Interested: ${product}
Outcome Status: ${status}
Agent Call Notes: ${agentNotes}

Formatting rule: Be concise, professional, bulleted key points or action item.`,
      });
      if (response.text) {
        return response.text.trim();
      }
    }
  } catch (error) {
    console.warn('Gemini API call warning or offline, falling back to smart template generator:', error);
  }

  // Smart fallback generator if key unavailable
  return `[AI Summary] Customer ${customerName} evaluated ${product} (${status}). Key outcome: ${agentNotes || 'No specific notes entered.'}`;
}

export async function generateSalesScript(product: string, customerCity: string): Promise<string> {
  try {
    const client = getAiClient();
    if (client) {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a 3-bullet pitch talk track for a field sales agent calling a customer in ${customerCity} for ${product}. Focus on value proposition, main hook, and closing question.`,
      });
      if (response.text) {
        return response.text.trim();
      }
    }
  } catch (err) {
    console.warn('Script generation fallback used:', err);
  }

  return `1. Hook: "Hello! I am calling regarding your recent request for ${product} in ${customerCity}."\n2. Value: "We offer zero processing fees and instant approval today."\n3. Call to Action: "Can I confirm a quick 2-minute overview or schedule a doorstep visit?"`;
}
