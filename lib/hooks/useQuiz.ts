import { useState, useCallback, useRef, useEffect } from 'react'
import { Question, QuizConfig, LoadingState } from '@/lib/types'

interface QuizState {
  questions: Question[]
  currentQuestion: number
  selectedAnswer: number | null
  score: number
  showResult: boolean
  timeLeft: number
  showAnswer: boolean
  isCorrect: boolean
  aiResponse: string
  streak: number
  totalPoints: number
}

const INITIAL_QUIZ_STATE: QuizState = {
  questions: [],
  currentQuestion: 0,
  selectedAnswer: null,
  score: 0,
  showResult: false,
  timeLeft: 30,
  showAnswer: false,
  isCorrect: false,
  aiResponse: '',
  streak: 0,
  totalPoints: 0
}

export function useQuiz(config: QuizConfig) {
  const [state, setState] = useState<QuizState>(INITIAL_QUIZ_STATE)
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: true, error: null })
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isSubmittingRef = useRef(false)

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
        if (prev.showAnswer || loadingState.isLoading || prev.showResult || isSubmittingRef.current) {
          return prev
        }
        
        if (prev.timeLeft <= 1) {
          return { ...prev, timeLeft: 0 }
        }
        
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
  }, [loadingState.isLoading, clearTimer])

  const generateQuiz = useCallback(async () => {
    try {
      setLoadingState({ isLoading: true, error: null })
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: config.topic,
          difficulty: config.difficulty,
          count: config.questionCount
        })
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
      
      setState(prev => ({ ...prev, questions: data.questions }))
      setLoadingState({ isLoading: false, error: null })
      startTimer()
    } catch (error) {
      console.error('Quiz generation error:', error)
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate quiz'
      })
    }
  }, [config, startTimer])

  const calculatePoints = useCallback((timeLeft: number, streak: number, difficulty: string) => {
    const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
    const speedBonus = Math.floor((timeLeft / 30) * 10)
    const streakBonus = streak * 5
    return basePoints + speedBonus + streakBonus
  }, [])

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

  const selectAnswer = useCallback((answerIndex: number) => {
    if (state.showAnswer || isSubmittingRef.current) return
    setState(prev => ({ ...prev, selectedAnswer: answerIndex }))
  }, [state.showAnswer])

  const submitAnswer = useCallback(async () => {
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
      points = calculatePoints(state.timeLeft, state.streak, config.difficulty)
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
      isSubmittingRef.current = false
    }, 3000)
  }, [state, clearTimer, calculatePoints, config.difficulty, getAIResponse])

  const nextQuestion = useCallback(() => {
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
      isSubmittingRef.current = false
    }, 3000)
  }, [state.showAnswer, clearTimer])

  const reset = useCallback(() => {
    setState(INITIAL_QUIZ_STATE)
    setLoadingState({ isLoading: true, error: null })
    clearTimer()
    isSubmittingRef.current = false
  }, [clearTimer])

  // Handle timer expiration
  useEffect(() => {
    if (state.timeLeft === 0 && !state.showAnswer && !isSubmittingRef.current) {
      handleTimeUp()
    }
  }, [state.timeLeft, state.showAnswer, handleTimeUp])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    // State
    ...state,
    ...loadingState,
    
    // Actions
    generateQuiz,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    reset,
    
    // Computed
    currentQuestionData: state.questions[state.currentQuestion],
    progress: state.questions.length > 0 ? ((state.currentQuestion + 1) / state.questions.length) * 100 : 0,
    canSubmit: state.selectedAnswer !== null && !state.showAnswer && !isSubmittingRef.current
  }
}