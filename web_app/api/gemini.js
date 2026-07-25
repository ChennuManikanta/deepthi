import https from "https";

// Serverless proxy for the Gemini API. The key stays server-side (set
// GEMINI_API_KEY in the Vercel project env vars) and never reaches the browser.
// The browser POSTs a Gemini generateContent body plus a `model` field.

const HOST = "generativelanguage.googleapis.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Keep only printable ASCII (32-126) to strip any BOM or invisible chars
  const raw = process.env.GEMINI_API_KEY || "";
  const apiKey = raw.split("").filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).join("");
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    return;
  }

  const { model = "gemini-2.5-flash", ...payload } = req.body || {};
  const bodyStr = JSON.stringify(payload);

  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      path: `/v1beta/models/${model}:generateContent`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    const request = https.request(options, (upstream) => {
      let data = "";
      upstream.on("data", (chunk) => { data += chunk; });
      upstream.on("end", () => {
        try {
          res.status(upstream.statusCode).json(JSON.parse(data));
        } catch {
          res.status(500).json({ error: "Failed to parse Gemini response" });
        }
        resolve();
      });
    });

    request.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(bodyStr);
    request.end();
  });
}
