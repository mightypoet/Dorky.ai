import { GoogleGenAI } from "@google/genai";
import { Lead, SearchParams } from "../types.ts";

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
  // We initialize the client right before use to ensure the latest process.env.API_KEY
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async discoverLeads(params: SearchParams): Promise<Partial<Lead>[]> {
    const ai = this.getClient();
    const { niche, location, leadCount, competitor } = params;
    const cleanCompetitor = competitor ? competitor.replace('@', '') : '';

    const prompt = `
      ROLE: OSINT Intelligence Officer.
      OBJECTIVE: Identify ${Math.min(leadCount, 25)} Instagram handles in the "${niche}" niche.
      LOCATION: ${location || "Global"}
      ${cleanCompetitor ? `REFERENCE: Similar to @${cleanCompetitor}` : ''}

      STRATEGY:
      - Use "site:instagram.com" search queries.
      - Target handles mentioned in bio descriptions, contact lists, or verified business profiles.
      - Ensure accounts are currently active.

      RETURN JSON ARRAY ONLY:
      [{"username": "handle", "fullName": "Name", "bio": "Bio summary", "location": "City/Country"}]
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
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Discovery error:", error);
      return [];
    }
  }

  async enrichLead(lead: Partial<Lead>): Promise<Lead> {
    const ai = this.getClient();
    const prompt = `
      TARGET: @${lead.username}
      SEARCH: "instagram.com/${lead.username}" + public contact data.
      EXTRACT: Email, Website, Phone, and follower count from public snippets.
      
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
        source: 'Intelligence Scan',
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