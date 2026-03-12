import { OpenAI } from "openai";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

function parseBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function normalizeMessages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .filter(msg =>
      msg &&
      ["system", "user", "assistant"].includes(msg.role) &&
      typeof msg.content === "string" &&
      msg.content.trim()
    )
    .map(msg => ({
      role: msg.role,
      content: msg.content.trim(),
    }));
}

function extractReplyContent(messageContent) {
  if (typeof messageContent === "string") {
    return messageContent.trim();
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.HF_TOKEN) {
    return res.status(500).json({ error: "Missing HF_TOKEN environment variable" });
  }

  try {
    const body = parseBody(req);
    const messages = normalizeMessages(body.messages);

    if (!messages.length) {
      return res.status(400).json({ error: "Missing or invalid messages" });
    }

    const completion = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-72B-Instruct:featherless-ai",
      messages,
      temperature: 0.7,
      max_tokens: 400,
    });

    const reply = extractReplyContent(
      completion?.choices?.[0]?.message?.content
    );

    if (!reply) {
      return res.status(502).json({ error: "Model returned empty reply" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("[/api/vietsoul-chat]", error);

    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Chat API failed";

    return res.status(500).json({ error: message });
  }
}