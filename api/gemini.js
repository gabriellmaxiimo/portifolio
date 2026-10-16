import { handleGemini } from "../GeminiAPI/api/_gemini.js";

export default function handler(req, res) {
  return handleGemini(req, res, process.env);
}
