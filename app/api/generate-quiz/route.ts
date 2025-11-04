import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, difficulty, count, sourceText } = await req.json();

    const difficultyGuides = {
      easy: 'Basic concepts, simple recall, fundamental definitions',
      medium: 'Application of concepts, moderate problem-solving, connections between ideas', 
      hard: 'Complex analysis, advanced problem-solving, synthesis of multiple concepts'
    };

    const prompt = `
You are a professional quiz creator. Generate ${count} multiple-choice questions
${sourceText ? `based ONLY on this content:\n\n${sourceText}\n\n` : `on the topic "${topic}"`}

Difficulty: ${difficulty} (${difficultyGuides[difficulty as keyof typeof difficultyGuides]})

${!sourceText ? `For ${topic}:
- Easy: Grade 6-8 level concepts
- Medium: High school level analysis  
- Hard: College/advanced level thinking` : ''}

IMPORTANT: 
- Double-check all calculations and facts for accuracy
- Ensure the correct answer is actually correct
- Make plausible but incorrect distractors
- Each question must have exactly one correct answer

Return ONLY valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
`;

    // --- Primary (Groq) ---
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ questions, modelUsed: sourceText ? "Groq (File-based)" : "Groq Llama3.1-70B" });
      }
    }

    // --- Fallback (OpenRouter) ---
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (openRouterResponse.ok) {
      const fallbackData = await openRouterResponse.json();
      const content = fallbackData.choices[0].message.content;
      
      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ questions, modelUsed: sourceText ? "OpenRouter (File-based)" : "OpenRouter Mixtral-8x7B" });
      }
    }

    throw new Error("Both APIs failed");

  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}