const MODEL = "claude-sonnet-5-5";
const WORDS = [50, 100, 200, 500, 1000];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST use karo" }) };
  }
  try {
    const { topic, words, language, mode } = JSON.parse(event.body || "{}");
    const t = String(topic || "").trim().slice(0, 150);
    const w = Number(words);
    const lang = String(language || "Hindi").slice(0, 30);
    if (!t) return { statusCode: 400, body: JSON.stringify({ error: "Topic likho." }) };
    if (!WORDS.includes(w)) return { statusCode: 400, body: JSON.stringify({ error: "Galat word count." }) };

    const task = mode === "application"
      ? `Write a formal application/letter in ${lang} on this subject: "${t}". Use proper format (To, Subject, salutation, body, closing, From, Date placeholder). About ${w} words.`
      : `Write an essay (nibandh) in ${lang} on the topic: "${t}". About ${w} words, with a short title, introduction, body and conclusion. Keep the language simple and suitable for school students.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: "You write school essays and letters. Output only the final text, with no preamble or notes.",
        messages: [{ role: "user", content: task }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "AI se jawab nahi mila." }) };
    }
    const text = (data.content || []).map((b) => b.text || "").join("").trim();
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error." }) };
  }
};
