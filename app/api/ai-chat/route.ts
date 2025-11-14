import { NextRequest, NextResponse } from 'next/server'

const responses = {
  topic: [
    "🎯 Awesome choice! \"{topic}\" sounds fascinating. Let's make this challenging - what difficulty level gets your brain buzzing?",
    "🚀 Nice topic! \"{topic}\" is going to be epic. Ready to level up? Pick your difficulty:",
    "⚡ Love it! \"{topic}\" is a great subject. Time to choose your challenge level:",
    "🎮 Sweet! \"{topic}\" will make for an amazing quiz. What's your skill level?"
  ],
  difficulty: [
    "🔥 {difficulty} mode activated! You're brave. How many questions can you handle? (5-20)",
    "💪 {difficulty} difficulty locked in! Feeling confident? How many questions?",
    "⚔️ {difficulty} level selected! Ready for battle? Pick your question count:",
    "🎯 {difficulty} it is! Let's see what you're made of. Question count?"
  ],
  questions: [
    "🎊 Perfect! {count} {difficulty} questions about \"{topic}\" coming right up! Get ready to earn some serious points! 🏆",
    "🚀 Locked and loaded! {count} {difficulty} questions on \"{topic}\". Time to show off your knowledge! 💎",
    "⚡ Game on! {count} {difficulty}-level questions about \"{topic}\". Let's see those brain muscles flex! 🧠",
    "🎮 Challenge accepted! {count} {difficulty} questions on \"{topic}\". Points and glory await! ⭐"
  ],
  encouragement: [
    "🔥 You're on fire! Keep that momentum going!",
    "💪 Beast mode activated! Show them what you're made of!",
    "⚡ Lightning fast! Your brain is working overtime!",
    "🎯 Bullseye! You're hitting all the right notes!",
    "🚀 To the moon! Your knowledge is out of this world!"
  ],
  correct: [
    "🎉 BOOM! Nailed it! +{points} points!",
    "⚡ Lightning strike! Correct! +{points} points!",
    "🔥 On fire! That's right! +{points} points!",
    "💎 Brilliant! Perfect answer! +{points} points!",
    "🎯 Bullseye! Spot on! +{points} points!"
  ],
  wrong: [
    "💥 Ouch! Not quite, but you're learning! The answer was: {correct}",
    "🤔 Close call! The correct answer is: {correct}",
    "📚 Learning moment! It's actually: {correct}",
    "🎯 Almost there! The right answer is: {correct}"
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()
    
    const responseArray = responses[type as keyof typeof responses]
    if (!responseArray) {
      return NextResponse.json({ error: 'Invalid response type' }, { status: 400 })
    }
    
    const template = responseArray[Math.floor(Math.random() * responseArray.length)]
    
    // Replace placeholders with actual data
    let response = template
    if (data) {
      Object.keys(data).forEach(key => {
        response = response.replace(new RegExp(`{${key}}`, 'g'), data[key])
      })
    }
    
    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}