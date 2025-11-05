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
    console.log('🔍 DEBUG: Attempting Groq API call...');
    console.log('🔍 DEBUG: Groq API Key exists:', !!process.env.GROQ_API_KEY);
    
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    console.log('🔍 DEBUG: Groq response status:', groqResponse.status);
    console.log('🔍 DEBUG: Groq response ok:', groqResponse.ok);
    
    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const content = data.choices[0].message.content;
      console.log('🔍 DEBUG: Groq response content:', content.substring(0, 200) + '...');
      
      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      console.log('🔍 DEBUG: JSON match found:', !!jsonMatch);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        console.log('✅ DEBUG: Using Groq successfully');
        return NextResponse.json({ questions, modelUsed: sourceText ? "Groq (File-based)" : "Groq Llama3.1-70B" });
      }
    } else {
      const errorText = await groqResponse.text();
      console.log('❌ DEBUG: Groq failed with error:', errorText);
    }

    // --- Fallback (OpenRouter) ---
    console.log('🔄 DEBUG: Falling back to OpenRouter...');
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    console.log('🔍 DEBUG: OpenRouter response status:', openRouterResponse.status);
    if (openRouterResponse.ok) {
      const fallbackData = await openRouterResponse.json();
      const content = fallbackData.choices[0].message.content;
      console.log('🔍 DEBUG: OpenRouter response content:', content.substring(0, 200) + '...');
      
      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        console.log('✅ DEBUG: Using OpenRouter fallback');
        return NextResponse.json({ questions, modelUsed: sourceText ? "OpenRouter (File-based)" : "OpenRouter GPT-4o-mini" });
      }
    } else {
      const errorText = await openRouterResponse.text();
      console.log('❌ DEBUG: OpenRouter also failed:', errorText);
    }

    // --- Final Fallback (Google Gemini) ---
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      console.log('🔄 DEBUG: Falling back to Google Gemini...');
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      });

      console.log('🔍 DEBUG: Gemini response status:', geminiResponse.status);
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const content = geminiData.candidates[0].content.parts[0].text;
        console.log('🔍 DEBUG: Gemini response content:', content.substring(0, 200) + '...');
        
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          console.log('✅ DEBUG: Using Google Gemini fallback');
          return NextResponse.json({ questions, modelUsed: sourceText ? "Gemini (File-based)" : "Google Gemini-1.5-Flash" });
        }
      } else {
        const errorText = await geminiResponse.text();
        console.log('❌ DEBUG: Gemini also failed:', errorText);
      }
    }

    throw new Error("All APIs failed");

  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}