'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/LoginModal'
import MultiplayerModal from '@/components/MultiplayerModal'
import GambleModal from '@/components/GambleModal'
import Navbar from '@/components/Navbar'
import WelcomeDialog from '@/components/WelcomeDialog'

type ConversationStep = 'topic' | 'mode' | 'difficulty' | 'questions' | 'generating'

interface Message {
  type: 'user' | 'assistant'
  content: string
}

interface QuizConfig {
  topic: string
  mode: string
  difficulty: string
  questionCount: number
}

const TOPIC_SUGGESTIONS = ['Mathematics', 'Science', 'History', 'Literature', 'Geography', 'Sports', 'Technology', 'Art']

const MODE_OPTIONS = [
  { name: 'Solo', key: 'solo', emoji: '🎯', desc: 'Practice alone' },
  { name: 'Multiplayer', key: 'multiplayer', emoji: '⚔️', desc: 'Battle others' },
  { name: 'Gamble', key: 'gamble', emoji: '💰', desc: 'Bet & win' }
]

const DIFFICULTY_OPTIONS = [
  { name: 'Easy', color: 'emerald', points: '2x', emoji: '🟢' },
  { name: 'Medium', color: 'blue', points: '3x', emoji: '🔵' },
  { name: 'Hard', color: 'cyan', points: '5x', emoji: '🔥' }
]

const QUESTION_OPTIONS = [
  { count: 5, emoji: '⚡' }, { count: 10, emoji: '🎯' }, { count: 15, emoji: '🔥' },
  { count: 20, emoji: '💪' }, { count: 30, emoji: '🚀' }, { count: 50, emoji: '🏆' }
]

export default function HomePage() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [conversationStep, setConversationStep] = useState<ConversationStep>('topic')
  const [messages, setMessages] = useState<Message[]>([])
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    topic: '',
    mode: '',
    difficulty: 'medium',
    questionCount: 10
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [showGamble, setShowGamble] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getAIResponse = useCallback((step: ConversationStep, input: string): string => {
    const responses = {
      topic: [
        `🎯 Awesome choice! "${input}" sounds fascinating. What mode would you like to play?`,
        `🚀 Nice topic! "${input}" is going to be epic. Choose your battle mode:`,
        `⚡ Love it! "${input}" is a great subject. Pick your game mode:`,
        `🎮 Sweet! "${input}" will make for an amazing quiz. What's your preferred mode?`
      ],
      mode: [
        `🎯 ${input.toUpperCase()} mode selected! Now let's set the difficulty - what level gets your brain buzzing?`,
        `🚀 ${input.toUpperCase()} it is! Ready to level up? Pick your difficulty:`,
        `⚡ ${input.toUpperCase()} mode locked in! Time to choose your challenge level:`,
        `🎮 ${input.toUpperCase()} mode activated! What's your skill level?`
      ],
      difficulty: [
        `🔥 ${input.toUpperCase()} mode activated! You're brave. How many questions can you handle?`,
        `💪 ${input.toUpperCase()} difficulty locked in! Feeling confident? How many questions?`,
        `⚔️ ${input.toUpperCase()} level selected! Ready for battle? Pick your question count:`,
        `🎯 ${input.toUpperCase()} it is! Let's see what you're made of. Question count?`
      ],
      questions: [
        `🎊 Perfect! ${input} ${quizConfig.difficulty} questions about "${quizConfig.topic}" coming right up! Get ready to earn some serious points! 🏆`,
        `🚀 Locked and loaded! ${input} ${quizConfig.difficulty} questions on "${quizConfig.topic}". Time to show off your knowledge! 💎`,
        `⚡ Game on! ${input} ${quizConfig.difficulty}-level questions about "${quizConfig.topic}". Let's see those brain muscles flex! 🧠`,
        `🎮 Challenge accepted! ${input} ${quizConfig.difficulty} questions on "${quizConfig.topic}". Points and glory await! ⭐`
      ],
      generating: ['Perfect! Generating your quiz now...']
    }
    
    const options = responses[step] || []
    return options[Math.floor(Math.random() * options.length)]
  }, [quizConfig])

  const validateInput = useCallback((step: ConversationStep, input: string): { valid: boolean; error?: string } => {
    switch (step) {
      case 'topic':
        return input.trim().length >= 3 
          ? { valid: true }
          : { valid: false, error: '🤔 That\'s a bit short! Please give me a proper topic like "Mathematics" or "History".' }
      
      case 'mode':
        const validModes = ['solo', 's', '1', 'single', 'multiplayer', 'multi', 'm', '2', 'battle', 'gamble', 'g', '3', 'bet', 'wager']
        return validModes.includes(input.toLowerCase())
          ? { valid: true }
          : { valid: false, error: '🎮 Please choose: solo, multiplayer, or gamble' }
      
      case 'difficulty':
        const validDifficulties = ['easy', 'e', '1', 'medium', 'm', '2', 'hard', 'h', '3', 'beast']
        return validDifficulties.includes(input.toLowerCase())
          ? { valid: true }
          : { valid: false, error: '🎯 Please choose a valid difficulty: easy, medium, or hard' }
      
      case 'questions':
        const count = parseInt(input)
        if (isNaN(count) || count < 5) {
          return { valid: false, error: '🔢 Please enter a valid number of questions (5 or more)!' }
        }
        if (count > 50) {
          return { valid: false, error: '🚫 Whoa there! Maximum 50 questions allowed. Let\'s try that again!' }
        }
        return { valid: true }
      
      default:
        return { valid: true }
    }
  }, [])

  const processInput = useCallback((step: ConversationStep, input: string) => {
    switch (step) {
      case 'topic':
        return input.trim()
      
      case 'mode':
        const modeMap: Record<string, string> = {
          'solo': 'solo', 's': 'solo', '1': 'solo', 'single': 'solo',
          'multiplayer': 'multiplayer', 'multi': 'multiplayer', 'm': 'multiplayer', '2': 'multiplayer', 'battle': 'multiplayer',
          'gamble': 'gamble', 'g': 'gamble', '3': 'gamble', 'bet': 'gamble', 'wager': 'gamble'
        }
        return modeMap[input.toLowerCase()] || 'solo'
      
      case 'difficulty':
        const difficultyMap: Record<string, string> = {
          'easy': 'easy', 'e': 'easy', '1': 'easy',
          'medium': 'medium', 'm': 'medium', '2': 'medium',
          'hard': 'hard', 'h': 'hard', '3': 'hard', 'beast': 'hard'
        }
        return difficultyMap[input.toLowerCase()] || 'medium'
      
      case 'questions':
        return Math.min(Math.max(parseInt(input) || 10, 5), 50).toString()
      
      default:
        return input
    }
  }, [])

  const handleStartQuiz = useCallback(async () => {
    setIsLoading(true)
    
    try {
      if (quizConfig.topic && !fileContent) {
        await fetch('/api/track-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: quizConfig.topic })
        })
      }
      
      const params = new URLSearchParams({
        topic: quizConfig.topic,
        difficulty: quizConfig.difficulty,
        count: quizConfig.questionCount.toString(),
        ...(fileContent && { content: fileContent })
      })
      
      router.push(`/quiz?${params.toString()}`)
    } catch (error) {
      console.error('Failed to start quiz:', error)
      setIsLoading(false)
    }
  }, [quizConfig, fileContent, router])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage: Message = { type: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    
    const validation = validateInput(conversationStep, inputValue)
    if (!validation.valid) {
      setMessages(prev => [...prev, { type: 'assistant', content: validation.error! }])
      setInputValue('')
      return
    }
    
    const processedInput = processInput(conversationStep, inputValue)
    const response = getAIResponse(conversationStep, processedInput)
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'assistant', content: response }])
      
      switch (conversationStep) {
        case 'topic':
          setQuizConfig(prev => ({ ...prev, topic: processedInput }))
          setConversationStep('mode')
          break
        case 'mode':
          setQuizConfig(prev => ({ ...prev, mode: processedInput }))
          setConversationStep('difficulty')
          break
        case 'difficulty':
          setQuizConfig(prev => ({ ...prev, difficulty: processedInput }))
          setConversationStep('questions')
          break
        case 'questions':
          setQuizConfig(prev => ({ ...prev, questionCount: parseInt(processedInput) }))
          setConversationStep('generating')
          setTimeout(() => {
            if (quizConfig.mode === 'solo') {
              handleStartQuiz()
            } else if (quizConfig.mode === 'multiplayer') {
              setShowMultiplayer(true)
            } else if (quizConfig.mode === 'gamble') {
              setShowGamble(true)
            }
          }, 1500)
          break
      }
    }, 800)
    
    setInputValue('')
  }, [inputValue, conversationStep, isLoading, validateInput, processInput, getAIResponse, quizConfig.mode, handleStartQuiz])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setFileContent(text)
    }
    reader.readAsText(file)
  }, [])

  const handleTopicSelect = useCallback((topic: string) => {
    setInputValue(topic)
    setTimeout(handleSendMessage, 100)
  }, [handleSendMessage])

  const handleOptionSelect = useCallback((value: string) => {
    setInputValue(value)
    handleSendMessage()
  }, [handleSendMessage])

  const renderSuggestedActions = () => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.type !== 'assistant') return null

    switch (conversationStep) {
      case 'mode':
        return (
          <div className="flex flex-wrap gap-2 max-w-md">
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode.key}
                onClick={() => handleOptionSelect(mode.key)}
                className="px-5 py-4 md:px-4 md:py-3 text-base md:text-sm bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-all transform active:scale-95 md:hover:scale-105 border border-blue-200 dark:border-blue-800"
              >
                <div className="text-lg md:text-base">{mode.emoji} {mode.name}</div>
                <div className="text-xs opacity-70">{mode.desc}</div>
              </button>
            ))}
          </div>
        )
      
      case 'difficulty':
        return (
          <div className="flex flex-wrap gap-2 max-w-md">
            {DIFFICULTY_OPTIONS.map((diff) => (
              <button
                key={diff.name}
                onClick={() => handleOptionSelect(diff.name.toLowerCase())}
                className={`px-5 py-4 md:px-4 md:py-3 text-base md:text-sm bg-${diff.color}-100 hover:bg-${diff.color}-200 dark:bg-${diff.color}-900/20 dark:hover:bg-${diff.color}-800/30 text-${diff.color}-800 dark:text-${diff.color}-200 rounded-lg font-medium transition-all transform active:scale-95 md:hover:scale-105 border border-${diff.color}-200 dark:border-${diff.color}-800`}
              >
                <div className="text-lg md:text-base">{diff.emoji} {diff.name}</div>
                <div className="text-xs opacity-70">({diff.points} points)</div>
              </button>
            ))}
          </div>
        )
      
      case 'questions':
        return (
          <div className="flex flex-wrap gap-2 max-w-md">
            {QUESTION_OPTIONS.map((item) => (
              <button
                key={item.count}
                onClick={() => handleOptionSelect(item.count.toString())}
                className="px-5 py-4 md:px-4 md:py-3 text-base md:text-sm bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-all transform active:scale-95 md:hover:scale-105 border border-blue-200 dark:border-blue-800"
              >
                <div className="text-lg md:text-base">{item.emoji} {item.count}</div>
                <div className="text-xs opacity-70">questions</div>
              </button>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  const getPlaceholder = () => {
    switch (conversationStep) {
      case 'topic': return '🎯 Enter a subject like "Mathematics" or "History"...'
      case 'mode': return '🎮 Type: solo, multiplayer, or gamble'
      case 'difficulty': return '🎮 Type: easy, medium, or hard'
      case 'questions': return '🔢 Enter number: 5-50 questions'
      default: return '🚀 Generating your epic quiz...'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        
        <div className="flex-1 flex flex-col justify-center py-8">
          {messages.length === 0 ? (
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">🧠⚡</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                  Ready to Level Up Your Brain?
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Choose a topic or type your own! 🚀</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-2xl mx-auto">
                {TOPIC_SUGGESTIONS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className="px-4 py-4 md:py-3 text-base md:text-sm bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-all transform active:scale-95 md:hover:scale-105 border border-blue-200 dark:border-blue-800"
                  >
                    {topic}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>Easy: 2x Points
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>Medium: 3x Points
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-1"></span>Hard: 5x Points
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="space-y-3">
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}>
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>
                    {index === messages.length - 1 && renderSuggestedActions()}
                  </div>
                </div>
              ))}
              
              {conversationStep === 'generating' && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm">🧠 Crafting your challenge...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={getPlaceholder()}
                disabled={conversationStep === 'generating' || isLoading}
                className="w-full px-4 py-4 pr-24 text-base text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  title="Upload file"
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || conversationStep === 'generating' || isLoading}
                  className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
            </div>
            {uploadedFile && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                ✓ {uploadedFile.name} uploaded
              </p>
            )}
          </div>
        </div>

        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
        
        <MultiplayerModal 
          open={showMultiplayer} 
          onClose={() => setShowMultiplayer(false)}
          topic={quizConfig.topic}
          difficulty={quizConfig.difficulty}
          questionCount={quizConfig.questionCount}
        />
        
        <GambleModal 
          open={showGamble} 
          onClose={() => setShowGamble(false)}
          topic={quizConfig.topic}
          difficulty={quizConfig.difficulty}
          questionCount={quizConfig.questionCount}
        />
      </div>
      
      <WelcomeDialog />
    </div>
  )
}