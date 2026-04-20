import { Router } from "express";
import { requireAuth } from "./middleware";
import { fetchMatches, type MatchSummary } from "./matches";

const router = Router();
router.use(requireAuth);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MAX_RETRIES = parseEnvInt(process.env.GEMINI_MAX_RETRIES, 2);
const GEMINI_RETRY_BASE_DELAY_MS = parseEnvInt(process.env.GEMINI_RETRY_BASE_DELAY_MS, 1000);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiResult =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      status: number | null;
      message: string;
      retryable: boolean;
    };

const BASE_PROMPT = `You are a knowledgeable football (soccer) assistant for the Ball Stream Pro app.
You help users with questions about tactics, formations, player stats, transfer news,
match analysis, and football history. Keep answers concise and engaging.
Use markdown formatting for readability (bold, lists, headers).
If asked about non-football topics, politely redirect to football.
When answering questions about current scores, fixtures, or recent results, only use the live match feed provided below.
If the requested match is not in that feed, say the current live data is unavailable instead of guessing.`;

function buildMatchContext(matches: MatchSummary[]): string {
  if (matches.length === 0) {
    return "\n\nNo current match feed entries were available for this request. If asked about live scores or fixtures, explain that current match data is unavailable right now.";
  }

  const live = matches.filter((match) => match.status === "live");
  const upcoming = matches.filter((match) => match.status === "upcoming");
  const finished = matches.filter((match) => match.status === "finished");

  let context = `\n\nCurrent match feed snapshot (${new Date().toISOString()}):\nUse only the entries below when answering questions about current scores, fixtures, and recent results.\n`;

  if (live.length > 0) {
    context += "\nLIVE MATCHES RIGHT NOW:\n";
    for (const match of live.slice(0, 10)) {
      context += `- ${match.teamA.name} ${match.score} ${match.teamB.name} (${match.league}, ${match.time})\n`;
    }
  }

  if (upcoming.length > 0) {
    context += "\nUPCOMING MATCHES:\n";
    for (const match of upcoming.slice(0, 15)) {
      context += `- ${match.teamA.name} vs ${match.teamB.name} (${match.league}, ${match.time})\n`;
    }
  }

  if (finished.length > 0) {
    context += "\nRECENT RESULTS:\n";
    for (const match of finished.slice(0, 15)) {
      context += `- ${match.teamA.name} ${match.score} ${match.teamB.name} (${match.league})\n`;
    }
  }

  if (live.length === 0 && upcoming.length === 0 && finished.length === 0) {
    context += "\nNo live, upcoming, or finished matches were returned by the feed.\n";
  }

  return context;
}

function parseEnvInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number): number {
  return GEMINI_RETRY_BASE_DELAY_MS * 2 ** attempt;
}

async function callGemini(apiKey: string, systemPrompt: string, question: string): Promise<GeminiResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
        }),
      });

      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as GeminiApiResponse) : null;

      if (response.ok) {
        const aiText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Sorry, I couldn't generate a response. Please try again!";

        return { ok: true, text: aiText };
      }

      const message = data?.error?.message || "Unknown error";
      const retryable = RETRYABLE_STATUS_CODES.has(response.status);

      if (retryable && attempt < GEMINI_MAX_RETRIES) {
        const delayMs = getRetryDelayMs(attempt);
        console.warn(
          `Gemini request failed with ${response.status} on attempt ${attempt + 1}/${GEMINI_MAX_RETRIES + 1}. Retrying in ${delayMs}ms.`,
        );
        await sleep(delayMs);
        continue;
      }

      console.error("Gemini API error:", JSON.stringify(data, null, 2));
      return {
        ok: false,
        status: response.status,
        message,
        retryable,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (attempt < GEMINI_MAX_RETRIES) {
        const delayMs = getRetryDelayMs(attempt);
        console.warn(
          `Gemini request threw on attempt ${attempt + 1}/${GEMINI_MAX_RETRIES + 1}. Retrying in ${delayMs}ms. ${message}`,
        );
        await sleep(delayMs);
        continue;
      }

      console.error("Gemini API error:", error);
      return {
        ok: false,
        status: null,
        message,
        retryable: true,
      };
    }
  }

  return {
    ok: false,
    status: null,
    message: "Gemini request exhausted all retry attempts.",
    retryable: true,
  };
}

// POST /api/ai/ask
router.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key") {
    return res.json({
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: "The AI assistant is not configured yet. Please add your Gemini API key to the `.env` file.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Reuse the existing match cache and refresh it on demand if needed.
    const matches = await fetchMatches();
    const systemPrompt = BASE_PROMPT + buildMatchContext(matches);
    const result = await callGemini(apiKey, systemPrompt, question);

    if ("retryable" in result) {
      const content = result.retryable
        ? `The Gemini service is temporarily overloaded right now. I retried ${GEMINI_MAX_RETRIES + 1} time(s), but it is still unavailable. Please try again in a moment.`
        : `API error (${result.status ?? "network"}) from ${GEMINI_MODEL}: ${result.message}.`;

      return res.json({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: result.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.json({
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: "Sorry, something went wrong with the AI service. Please try again.",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
