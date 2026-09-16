import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const FALLBACK_MODEL = "openai/gpt-oss-20b";

type ChatMessage = { role: "user" | "assistant"; content: string };

function systemPrompt(pet?: { name?: string; species?: string; breed?: string }) {
  const petLine = pet?.name
    ? `You are currently helping with ${pet.name}, a ${pet.breed ? pet.breed + " " : ""}${pet.species ?? "pet"}.`
    : "The person hasn't selected a specific pet yet — feel free to ask what pet they need help with.";

  return `You are Pawspero, PetSquare's warm, knowledgeable pet-care companion.
${petLine}

You help pet owners discover relevant products, vendors, services and deals on PetSquare,
and answer general pet-care questions.

Rules you must always follow:
- For any medical question (symptoms, illness, injury, medication, dosing), give only
  general, non-diagnostic information and clearly recommend consulting a qualified
  veterinarian. Never attempt to diagnose a condition or recommend a specific treatment.
- If something sounds urgent (difficulty breathing, suspected poisoning, collapse, seizure,
  serious bleeding or trauma), tell the person to contact a vet or emergency animal hospital
  immediately, before anything else.
- Keep answers concise and practical — this is a chat widget, not a long-form article.
- Write in clean GitHub-flavored Markdown. Use a short opening sentence, descriptive headings,
  and brief bullet or numbered lists when they improve readability.
- Never output HTML tags such as <br>. Avoid Markdown tables unless the information is genuinely
  tabular. Do not add a "Bottom line" section to every answer.
- Sound calm, capable, and friendly. Address the selected pet by name naturally. End with one
  useful next step when appropriate.
- You can suggest browsing PetSquare's Deals or Vendors pages for specific product/vendor
  needs, since you don't have live access to the current deal catalog in this conversation.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use the AI assistant." }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The AI assistant isn't configured yet — add GROQ_API_KEY to .env.local (see .env.example). Groq's free tier is enough to run this.",
      },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[]; pet?: { name?: string; species?: string; breed?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  try {
    const configuredModel = process.env.GROQ_MODEL || FALLBACK_MODEL;
    const call = (model: string) => fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt(body.pet) }, ...messages],
        temperature: 0.5,
        max_completion_tokens: 500,
      }),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    let res = await call(configuredModel);
    if (res.status === 404 && configuredModel !== FALLBACK_MODEL) res = await call(FALLBACK_MODEL);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Groq assistant error (${res.status}):`, errText.slice(0, 500));
      return NextResponse.json(
        { error: res.status === 429 ? "The assistant is busy. Please wait a moment and try again." : "The AI assistant could not respond. Please try again." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I didn't get a response — please try again.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Groq assistant request failed:", err);
    return NextResponse.json(
      { error: err instanceof Error && err.name === "TimeoutError" ? "The assistant took too long to respond. Please try again." : "The AI assistant is temporarily unavailable." },
      { status: 502 }
    );
  }
}
