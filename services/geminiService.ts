
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchParams, SearchMode } from "../types.ts";

const uuid = () => Math.random().toString(36).substring(2, 9);

const extractJson = (text: string | undefined | null) => {
  if (!text) return "[]";
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    clean = clean.replace(/\[cite:[^\]]*\]/g, '');
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start !== -1 && end !== -1 && start < end) {
      return clean.substring(start, end + 1);
    }
    const startObj = clean.indexOf('{');
    const endObj = clean.lastIndexOf('}');
    if (startObj !== -1 && endObj !== -1) {
      return `[${clean.substring(startObj, endObj + 1)}]`;
    }
    return "[]";
  } catch (e) {
    return "[]";
  }
};

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async discoverLeads(params: SearchParams): Promise<Partial<Lead>[]> {
    const ai = this.getClient();
    const { niche, location, leadCount, competitor, mode } = params;
    const cleanCompetitor = competitor ? competitor.replace('@', '') : '';

    const intensityNote = mode === 'forensic' 
      ? "Perform a deep-dive scan. Look for high-intent business profiles with clear contact calls-to-action." 
      : "Perform a rapid discovery scan for general active profiles.";

    const prompt = `
      ROLE: Advanced OSINT Intelligence Agent.
      INTENSITY: ${mode.toUpperCase()} MODE.
      OBJECTIVE: Extract ${Math.min(leadCount, 25)} Instagram handles in the "${niche}" niche.
      LOCATION: ${location || "Global"}
      ${cleanCompetitor ? `SIMILARITY SEED: @${cleanCompetitor}` : ''}
      
      ${intensityNote}

      REQUIREMENT:
      - Use "site:instagram.com" grounding for live verification.
      - Extract handles only from current, active public data.

      RETURN JSON ARRAY:
      [{"username": "handle", "fullName": "Name", "bio": "Bio", "location": "City"}]
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonStr = extractJson(response.text);
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed.map(p => ({ ...p, status: 'discovered' })) : [];
    } catch (error) {
      console.error("Discovery error:", error);
      return [];
    }
  }

  async enrichLead(lead: Partial<Lead>, mode: SearchMode = 'express'): Promise<Lead> {
    const ai = this.getClient();
    
    const forensicFocus = mode === 'forensic' 
        ? "Aggressively search for email addresses, business phone numbers, and LinkedIn/External website links mentioned in bio or linked services."
        : "Standard bio data extraction.";

    const prompt = `
      TARGET: @${lead.username} (Instagram)
      PROTOCOL: ${mode.toUpperCase()} ENRICHMENT.
      ${forensicFocus}

      SEARCH QUERIES:
      1. "instagram.com/${lead.username} email"
      2. "site:facebook.com ${lead.username} contact"
      3. "site:linkedin.com ${lead.username} ${lead.fullName}"

      RETURN JSON:
      {"email": "string", "phone": "string", "website": "url", "followers": "count", "category": "category", "engagementScore": 0-100}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonStr = extractJson(response.text);
      let parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData)) parsedData = parsedData[0] || {};

      return {
        id: uuid(),
        username: lead.username || "unknown",
        fullName: lead.fullName || "Unknown",
        niche: lead.niche || "General",
        location: parsedData.location || lead.location,
        bio: lead.bio || "",
        status: 'complete',
        source: mode === 'forensic' ? 'Forensic Scan' : 'Express Extract',
        ...parsedData
      } as Lead;
    } catch (error) {
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
