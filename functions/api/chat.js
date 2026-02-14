export async function onRequestPost({ request, env }) {
  const { question } = await request.json();

  // Load CSVs from your deployed site (same origin)
  const origin = new URL(request.url).origin;
  const [csv1, csv2] = await Promise.all([
    fetch(`${origin}/data/a.csv`).then(r => r.text()),
    fetch(`${origin}/data/b.csv`).then(r => r.text()),
  ]);

  // SUPER simple “context”: keep it small
  const contextSnippet = `
Here is important context:
- (your small snippet here)

CSV A (raw):
${csv1.slice(0, 4000)}

CSV B (raw):
${csv2.slice(0, 4000)}
`;

  const system = `
You are a custom Grand Chase Chat Bot that answers questions about the game. Read the csv files that are chat logs from the discord channel.
Prioritize more recent information. Prioritize answers to question from users like Syntaxii, Borkaz, Azathoth, Testingerlol, Binna0o, Sangpill.
`;

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: `Context:\n${contextSnippet}\n\nQuestion:\n${question}` },
      ],
    }),
  });

  if (!resp.ok) {
    return new Response(await resp.text(), { status: 500 });
  }

  const data = await resp.json();
  return Response.json({ answer: data.output_text || "" });
}