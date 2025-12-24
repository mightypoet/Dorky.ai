import { GoogleGenAI } from "@google/genai";
import { Lead, SearchParams } from "../types";

// Helper to generate a UUID
const uuid = () => Math.random().toString(36).substring(2, 9);

// Robust JSON extractor that handles markdown, raw text, and conversational wrappers
const extractJson = (text: string | undefined | null) => {
  if (!text) return "[]";

  try {
    // 1. Remove markdown code blocks
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    
    // 2. Remove citations (e.g. [cite: 12]) which often appear when using search tools
    // These break JSON parsing if they appear outside strings or cause array confusion
    clean = clean.replace(/\[cite:[^\]]*\]/g, '');

    // 3. Find the outer array brackets
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    
    if (start !== -1 && end !== -1) {
      // Ensure we found a valid range
      if (start < end) {
        return clean.substring(start, end + 1);
      }
    }
    
    // 4. Fallback for single object responses
    const startObj = clean.indexOf('{');
    const endObj = clean.lastIndexOf('}');
    if (startObj !== -1 && endObj !== -1) {
      return `[${clean.substring(startObj, endObj + 1)}]`;
    }
    
    return "[]";
  } catch (e) {
    console.error("JSON Extraction failed", e);
    return "[]";
  }
};

export class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  // Phase 1: Intelligent Discovery
  async discoverLeads(params: SearchParams): Promise<Partial<Lead>[]> {
    if (!this.apiKey) throw new Error("API Key missing");

    const { niche, location, leadCount, minFollowers, maxFollowers, competitor } = params;
    const cleanCompetitor = competitor ? competitor.replace('@', '') : '';

    const prompt = `
      ROLE: You are an elite OSINT (Open Source Intelligence) investigator.
      
      OBJECTIVE: Find ${Math.min(leadCount, 25)} distinct, publicly available Instagram profiles matching the EXACT parameters below.
      
      PARAMETERS:
      - Niche/Industry: "${niche}"
      - Target Location: "${location ? location : "Global/Any"}"
      ${cleanCompetitor ? `- Visual/Business Match: Similar to @${cleanCompetitor}` : ''}
      ${minFollowers ? `- Minimum Followers: ~${minFollowers}` : ''}
      ${maxFollowers ? `- Maximum Followers: ~${maxFollowers}` : ''}

      SEARCH STRATEGY (Use 'googleSearch' tool):
      1. Execute queries using "site:instagram.com".
      2. Combine Niche + Location explicitly (e.g., 'site:instagram.com "${niche}" "${location}"').
      3. Look for "contact", "email", "business" keywords in snippets to prioritize actionable leads.
      4. IGNORE aggregators, listicles, or "Top 10" articles. Extract ONLY specific user handles.
      
      STRICT CONSTRAINTS:
      - IF Location is set to "${location}", DISCARD profiles clearly from other regions.
      - IF Niche is "${niche}", DISCARD unrelated profiles.
      - Return ONLY the array.

      OUTPUT FORMAT (JSON Only):
      [
        {
          "username": "handle_only",
          "fullName": "Display Name",
          "bio": "Bio snippet found in search",
          "location": "Location inferred from snippet",
          "source": "Search Result Context"
        }
      ]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonStr = extractJson(response.text);
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Raw:", jsonStr);
        return [];
      }
      
      if (!Array.isArray(parsed)) return [];
      
      // Basic client-side deduplication based on username
      const unique = parsed.filter((v, i, a) => a.findIndex(t => (t.username === v.username)) === i);
      
      return unique;
    } catch (error) {
      console.error("Discovery error:", error);
      // Return empty array instead of throwing to allow app to handle "0 results" gracefully
      return [];
    }
  }

  // Phase 2: Deep Scan & Enrichment
  async enrichLead(lead: Partial<Lead>): Promise<Lead> {
    if (!this.apiKey) throw new Error("API Key missing");

    // We verify the location again during enrichment to ensure quality
    const prompt = `
      TARGET: @${lead.username} (${lead.fullName})
      CONTEXT: Checking alignment with Niche: "${lead.niche}" and Location: "${lead.location || 'Any'}".
      
      TASK: Perform a targeted search to find public contact details and metrics.
      
      STEPS:
      1. Search "instagram.com/${lead.username}" to read the current bio.
      2. Search "site:facebook.com ${lead.username}" or "site:linkedin.com ${lead.fullName}" for cross-referenced info.
      3. Extract Email, Phone, and Website if publicly available.
      4. Estimate engagement score (0-100) based on visible activity hints.

      RETURN JSON:
      {
        "email": "string_or_null",
        "phone": "string_or_null",
        "website": "url_or_null",
        "followers": "string_estimate (e.g. 15k)",
        "category": "Specific Category",
        "engagementScore": number,
        "location": "Confirmed Location"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonStr = extractJson(response.text);
      let parsedData;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
         console.warn("Enrich parse error", e);
         parsedData = {};
      }
      
      // extractJson often returns an array, so we handle both object and array return types
      const enrichedData = Array.isArray(parsedData) ? (parsedData[0] || {}) : parsedData;

      return {
        id: uuid(),
        username: lead.username || "unknown",
        fullName: lead.fullName || "Unknown",
        niche: lead.niche || "General",
        // Use enriched location if found, otherwise fallback to discovery location
        location: enrichedData.location || lead.location,
        bio: lead.bio || "",
        status: 'complete',
        source: 'Deep Dorking',
        ...enrichedData
      } as Lead;

    } catch (error) {
      // Fallback for failed enrichment
      return {
        id: uuid(),
        username: lead.username || "unknown",
        fullName: lead.fullName || "Unknown",
        niche: lead.niche || "General",
        location: lead.location,
        bio: lead.bio || "",
        email: null,
        engagementScore: 0,
        status: 'complete',
        source: 'Error Recovery'
      } as Lead;
    }
  }
}