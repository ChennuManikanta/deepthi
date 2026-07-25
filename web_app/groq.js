// Text LLM client — now backed by Gemini (via the /api/gemini serverless proxy).
// Export name kept as analyzeWithGroq so existing callers don't change.
const ENDPOINT = "/api/gemini";
const MODEL = "gemini-2.5-flash";

const SYSTEM =
  "You are a biomaterials expert specialising in genipin-crosslinked gelatin hydrogels. " +
  "Answer concisely (max 180 words) with practical wound-healing / tissue-engineering insight.";

export async function analyzeWithGroq(prompt) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}
