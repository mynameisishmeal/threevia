'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Brain, Clock, Trophy, ArrowLeft, Zap, Target, Star } from 'lucide-react'
import QuizResults from '@/components/QuizResults'

interface Question {
  question: string
  options: string[]
  correct: number
}

interface QuizState {
  questions: Question[]
  currentQuestion: number
  selectedAnswer: number | null
  score: number
  showResult: boolean
  loading: boolean
  timeLeft: number
  showAnswer: boolean
  isCorrect: boolean
  aiResponse: string
  streak: number
  totalPoints: number
  error: string | null
}

const INITIAL_STATE: QuizState = {
  questions: [],
  currentQuestion: 0,
  selectedAnswer: null,
  score: 0,
  showResult: false,
  loading: true,
  timeLeft: 30,
  showAnswer: false,
  isCorrect: false,
  aiResponse: '',
  streak: 0,
  totalPoints: 0,
  error: null
}

export default function QuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<QuizState>(INITIAL_STATE)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)

  const topic = searchParams.get('topic') || 'General Knowledge'
  const difficulty = searchParams.get('difficulty') || 'medium'
  const count = parseInt(searchParams.get('count') || '10')

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setState(prev => ({ ...prev, timeLeft: 30 }))
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.showAnswer || prev.loading || prev.showResult || isSubmittingRef.current) {
          return prev
        }
        
        if (prev.timeLeft <= 1) {
          // Time's up - auto submit
          setTimeout(() => handleTimeUp(), 0)
          return { ...prev, timeLeft: 0 }
        }
        
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
  }, [])

  const generateQuiz = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, count })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions received from API')
      }
      
      setState(prev => ({ 
        ...prev, 
        questions: data.questions, 
        loading: false 
      }))
      
      startTimer()
    } catch (error) {
      console.error('Quiz generation error:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to generate quiz'
      }))
    }
  }, [topic, difficulty, count, startTimer])

  const getAIResponse = useCallback(async (correct: boolean, points: number, correctAnswer: string) => {
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: correct ? 'correct' : 'wrong',
          data: { points, correct: correctAnswer }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.response
      }
    } catch (error) {
      console.error('AI response error:', error)
    }
    
    return correct ? '🎉 Correct!' : '❌ Wrong answer!'
  }, [])

  const calculatePoints = useCallback((timeLeft: number, streak: number, difficulty: string) => {
    const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
    const speedBonus = Math.floor((timeLeft / 30) * 10)
    const streakBonus = streak * 5
    return basePoints + speedBonus + streakBonus
  }, [])

  const handleTimeUp = useCallback(() => {
    if (isSubmittingRef.current || state.showAnswer) return
    
    isSubmittingRef.current = true
    clearTimer()
    
    setState(prev => ({
      ...prev,
      isCorrect: false,
      showAnswer: true,
      streak: 0,
      aiResponse: '⏰ Time\'s up! No points this round.'
    }))
    
    setTimeout(() => {
      handleNextQuestion()
      isSubmittingRef.current = false
    }, 3000)
  }, [state.showAnswer])

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (state.showAnswer || isSubmittingRef.current) return
    setState(prev => ({ ...prev, selectedAnswer: answerIndex }))
  }, [state.showAnswer])

  const handleSubmitAnswer = useCallback(async () => {
    if (state.selectedAnswer === null || isSubmittingRef.current || state.showAnswer) return
    
    isSubmittingRef.current = true
    clearTimer()
    
    const currentQuestion = state.questions[state.currentQuestion]
    const correct = state.selectedAnswer === currentQuestion.correct
    
    let points = 0
    let newScore = state.score
    let newTotalPoints = state.totalPoints
    let newStreak = state.streak
    
    if (correct) {
      points = calculatePoints(state.timeLeft, state.streak, difficulty)
      newScore = state.score + 1
      newTotalPoints = state.totalPoints + points
      newStreak = state.streak + 1
    } else {
      newStreak = 0
    }
    
    setState(prev => ({
      ...prev,
      isCorrect: correct,
      showAnswer: true,
      score: newScore,
      totalPoints: newTotalPoints,
      streak: newStreak
    }))
    
    // Get AI response
    const aiResponse = await getAIResponse(correct, points, currentQuestion.options[currentQuestion.correct])
    setState(prev => ({ ...prev, aiResponse }))
    
    setTimeout(() => {
      handleNextQuestion()
      isSubmittingRef.current = false
    }, 3000)
  }, [state, clearTimer, calculatePoints, difficulty, getAIResponse])

  const handleNextQuestion = useCallback(() => {
    if (state.currentQuestion + 1 < state.questions.length) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        showAnswer: false,
        isCorrect: false,
        aiResponse: ''
      }))
      startTimer()
    } else {
      setState(prev => ({ ...prev, showResult: true }))
      clearTimer()
    }
  }, [state.currentQuestion, state.questions.length, startTimer, clearTimer])

  const handleExit = useCallback(() => {
    clearTimer()
    router.push('/')
  }, [clearTimer, router])

  const handleTryAgain = useCallback(() => {
    setState(INITIAL_STATE)
    generateQuiz()
  }, [generateQuiz])

  // Initialize quiz
  useEffect(() => {
    generateQuiz()
    return () => clearTimer()
  }, [generateQuiz, clearTimer])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.showAnswer || state.loading || state.showResult || isSubmittingRef.current) return
      
      const question = state.questions[state.currentQuestion]
      if (!question) return
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const direction = e.key === 'ArrowUp' ? -1 : 1
        const currentIndex = state.selectedAnswer ?? -1
        const newIndex = Math.max(0, Math.min(3, currentIndex + direction))
        handleAnswerSelect(newIndex)
      }
      
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1
        if (index < question.options.length) {
          handleAnswerSelect(index)
        }
      }
      
      if (e.key === 'Enter' && state.selectedAnswer !== null) {
        handleSubmitAnswer()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, handleAnswerSelect, handleSubmitAnswer])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <Brain className="h-20 w-20 text-blue-400 mx-auto animate-pulse" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full animate-bounce"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">🧠 AI is crafting your challenge...</h1>
          <div className="flex justify-center space-x-1">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
          <p className="text-lg mb-6 opacity-80">{state.error}</p>
          <div className="space-x-4">
            <button 
              onClick={handleTryAgain}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={handleExit}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.showResult) {
    return (
      <QuizResults 
        score={state.score} 
        totalQuestions={state.questions.length} 
        topic={topic}
        difficulty={difficulty}
        onTryAgain={handleTryAgain}
        onNewQuiz={handleExit}
      />
    )
  }

  const question = state.questions[state.currentQuestion]
  if (!question) return null

  const progress = ((state.currentQuestion + 1) / state.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button 
          onClick={handleExit}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          aria-label="Exit quiz"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit</span>
        </button>
        
        <div className="flex items-center space-x-6">
          {/* Streak */}
          <div className="flex items-center space-x-2 bg-orange-500/20 px-4 py-2 rounded-xl">
            <Zap className="h-5 w-5 text-orange-400" />
            <span className="font-bold">{state.streak}x</span>
          </div>
          
          {/* Points */}
          <div className="flex items-center space-x-2 bg-cyan-500/20 px-4 py-2 rounded-xl">
            <Star className="h-5 w-5 text-cyan-400" />
            <span className="font-bold">{state.totalPoints}</span>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
            state.timeLeft <= 10 ? 'bg-red-500/20 animate-pulse' : 'bg-blue-500/20'
          }`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold text-xl">{state.timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-80">Question {state.currentQuestion + 1} of {state.questions.length}</span>
          <span className="text-sm opacity-80">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 max-w-4xl mx-auto">
        {/* Question */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full mb-6">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">{topic} • {difficulty.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{question.question}</h1>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {question.options.map((option, index) => {
            const isSelected = state.selectedAnswer === index
            const isCorrect = index === question.correct
            const isWrong = state.showAnswer && isSelected && !isCorrect
            
            let buttonClass = 'group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left '
            
            if (state.showAnswer) {
              if (isCorrect) {
                buttonClass += 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/25'
              } else if (isWrong) {
                buttonClass += 'border-red-400 bg-red-500/20 shadow-lg shadow-red-500/25'
              } else {
                buttonClass += 'border-white/20 bg-white/5 opacity-50'
              }
            } else {
              buttonClass += isSelected
                ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25 scale-105'
                : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15 hover:scale-102'
            }
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={buttonClass}
                disabled={state.showAnswer}
                aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                    state.showAnswer
                      ? isCorrect
                        ? 'bg-green-500 text-white'
                        : isWrong
                        ? 'bg-red-500 text-white'
                        : 'bg-white/20 text-white/60'
                      : isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white group-hover:bg-white/30'
                  }`}>
                    {state.showAnswer && isCorrect ? '✓' : state.showAnswer && isWrong ? '✗' : String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg font-medium flex-1">{option}</span>
                  {state.showAnswer && isCorrect && (
                    <Trophy className="h-6 w-6 text-cyan-400" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Area */}
        <div className="text-center">
          {!state.showAnswer ? (
            <button 
              onClick={handleSubmitAnswer}
              disabled={state.selectedAnswer === null || isSubmittingRef.current}
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {state.selectedAnswer !== null ? '🚀 Submit Answer' : '👆 Select an answer'}
            </button>
          ) : (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl ${
                state.isCorrect 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
              }`}>
                <div className="text-2xl font-bold mb-2">{state.aiResponse}</div>
                {state.isCorrect && (
                  <div className="text-lg opacity-90">
                    +{difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20} base points
                    {state.timeLeft > 0 && ` + ${Math.floor((state.timeLeft / 30) * 10)} speed bonus`}
                    {state.streak > 1 && ` + ${(state.streak - 1) * 5} streak bonus`}
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all"
              >
                {state.currentQuestion + 1 === state.questions.length ? '🏁 Finish Quiz' : '➡️ Next Question'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}