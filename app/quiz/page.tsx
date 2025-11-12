'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Clock, Trophy, ArrowLeft } from 'lucide-react'
import QuizResults from '@/components/QuizResults'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import ResumeQuizDialog from '@/components/ResumeQuizDialog'

interface Question {
  question: string
  options: string[]
  correct: number
}

export default function QuizPage() {
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [savedProgress, setSavedProgress] = useState<any>(null)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  const topic = searchParams.get('topic') || 'General Knowledge'
  const difficulty = searchParams.get('difficulty') || 'medium'
  const count = parseInt(searchParams.get('count') || '10')
  const sourceText = searchParams.get('sourceText') || ''

  useEffect(() => {
    generateQuiz()
  }, [])

  useEffect(() => {
    if (loading || showResult) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!showAnswer) {
            // Time ran out - deduct points and auto-submit
            setIsCorrect(false)
            setShowAnswer(true)
            // Deduct 5 points for timeout
            setScore(Math.max(0, score - 0.5))
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestion, loading, showResult])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAnswer || loading || showResult) return
      
      const question = questions[currentQuestion]
      if (!question) return
      
      // Arrow keys to select answers
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const direction = e.key === 'ArrowUp' ? -1 : 1
        const currentIndex = selectedAnswer ?? -1
        const newIndex = Math.max(0, Math.min(3, currentIndex + direction))
        setSelectedAnswer(newIndex)
      }
      
      // Number keys 1-4 to select answers
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1
        setSelectedAnswer(index)
      }
      
      // Enter to submit
      if (e.key === 'Enter' && selectedAnswer !== null) {
        handleSubmitAnswer()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnswer, showAnswer, loading, showResult, currentQuestion, questions])

  const [modelUsed, setModelUsed] = useState('')

  const generateQuiz = async () => {
    try {
      console.log('🔍 DEBUG: Starting generateQuiz function')
      
      // Check for saved progress first
      const progressResponse = await fetch('/api/load-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: localStorage.getItem('auth-token') ? 'user' : null, 
          topic, 
          difficulty 
        })
      })
      
      const progressData = await progressResponse.json()
      console.log('🔍 DEBUG: Progress data:', progressData)
      
      if (progressData.found) {
        console.log('🔍 DEBUG: Found saved progress, showing dialog')
        setSavedProgress(progressData)
        setShowResumeDialog(true)
        // Don't set loading to false here - let the dialog handle it
        return
      }
      
      console.log('🔍 DEBUG: Starting quiz generation for:', { topic, difficulty, count })
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, count, sourceText })
      })
      
      console.log('🔍 DEBUG: API response status:', response.status)
      if (!response.ok) {
        console.error('🔍 DEBUG: API response not ok:', response.statusText)
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('🔍 DEBUG: API response data:', data)
      
      if (data.error) {
        console.error('❌ DEBUG: API returned error:', data.error)
        console.log('🔍 DEBUG: Full debug info:', data.debug)
        alert(`AI Generation Failed: ${data.error}\n\nCheck console for details.`)
        setLoading(false)
        return
      }
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setModelUsed(data.modelUsed || 'Unknown')
        console.log('✅ DEBUG: Successfully loaded', data.questions.length, 'questions')
      } else {
        console.error('❌ DEBUG: No questions in response')
        alert('No questions received from API')
      }
      
      setLoading(false)
    } catch (error) {
      console.error('❌ DEBUG: Client error:', error)
      alert(`Client Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return // Prevent changing answer after submission
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    setSubmittingAnswer(true)
    const correct = selectedAnswer === questions[currentQuestion]?.correct
    setIsCorrect(correct)
    setShowAnswer(true)
    
    if (correct) {
      setScore(score + 1)
    }
    
    // Auto-advance after 3 seconds
    setTimeout(() => {
      handleNextQuestion()
      setSubmittingAnswer(false)
    }, 3000)
  }

  const handleNextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      const newQuestion = currentQuestion + 1
      setCurrentQuestion(newQuestion)
      setSelectedAnswer(null)
      setShowAnswer(false)
      setIsCorrect(false)
      setTimeLeft(30)
      
      // Auto-save progress
      saveProgress(newQuestion, score)
    } else {
      setShowResult(true)
      // Clear saved progress when quiz is complete
      clearProgress()
    }
  }
  
  const saveProgress = async (question: number, currentScore: number) => {
    try {
      await fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('auth-token') ? 'user' : null,
          topic,
          difficulty,
          currentQuestion: question,
          score: currentScore,
          questions
        })
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }
  
  const clearProgress = async () => {
    try {
      await fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('auth-token') ? 'user' : null,
          topic,
          difficulty,
          currentQuestion: -1, // Mark as completed
          score: 0,
          questions: []
        })
      })
    } catch (error) {
      console.error('Failed to clear progress:', error)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setShowResult(false)
    setShowAnswer(false)
    setIsCorrect(false)
    setTimeLeft(30)
  }

  const handleResumeQuiz = () => {
    if (savedProgress) {
      setQuestions(savedProgress.questions)
      setCurrentQuestion(savedProgress.currentQuestion)
      setScore(savedProgress.score)
      setModelUsed('Resumed')
      setLoading(false)
      setShowResumeDialog(false)
      return // Important: prevent generateQuiz from running
    }
    setShowResumeDialog(false)
  }

  const handleStartNewQuiz = () => {
    setShowResumeDialog(false)
    setSavedProgress(null) // Clear saved progress
    generateNewQuiz() // Generate fresh quiz
  }

  const generateNewQuiz = async () => {
    try {
      console.log('🔍 DEBUG: Starting quiz generation for:', { topic, difficulty, count })
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, count, sourceText })
      })
      
      const data = await response.json()
      
      if (data.error) {
        alert(`AI Generation Failed: ${data.error}`)
        setLoading(false)
        return
      }
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
        setModelUsed(data.modelUsed || 'Unknown')
      }
      
      setLoading(false)
    } catch (error) {
      alert(`Client Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Brain className="h-8 w-8 animate-pulse text-blue-600" />
                  <span className="text-xl font-semibold">Generating your quiz...</span>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <ResumeQuizDialog
          open={showResumeDialog}
          onResume={handleResumeQuiz}
          onStartNew={handleStartNewQuiz}
          savedAt={savedProgress?.lastSaved || ''}
          topic={topic}
          progress={savedProgress ? `${savedProgress.currentQuestion + 1}/${savedProgress.questions.length}` : ''}
        />
      </div>
    )
  }

  if (showResult) {
    return <QuizResults 
      score={score} 
      totalQuestions={questions.length} 
      topic={topic}
      difficulty={difficulty}
      onTryAgain={resetQuiz}
      onNewQuiz={() => window.location.href = '/'}
    />
  }

  const question = questions[currentQuestion]
  if (!question) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className={`font-mono ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {currentQuestion + 1} / {questions.length || count}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {currentQuestion + 1}
                </CardTitle>
                <div className="text-xs text-gray-500">
                  <div>Topic: {topic}</div>
                  <div>AI: {modelUsed}</div>
                  {sourceText && <div>📄 From uploaded file</div>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg sm:text-xl font-medium break-words">
                {question.question}
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index
                  const isCorrect = index === question.correct
                  const isWrong = showAnswer && isSelected && !isCorrect
                  
                  let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all duration-300 '
                  
                  if (showAnswer) {
                    if (isCorrect) {
                      buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    } else if (isWrong) {
                      buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    } else {
                      buttonClass += 'border-gray-200 dark:border-gray-700 opacity-60'
                    }
                  } else {
                    buttonClass += isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={buttonClass}
                      disabled={showAnswer}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          showAnswer
                            ? isCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : isWrong
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                            : isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {showAnswer && isCorrect ? '✓' : showAnswer && isWrong ? '✗' : String.fromCharCode(65 + index)}
                        </div>
                        <span className={showAnswer && isCorrect ? 'font-semibold' : ''}>{option}</span>
                        {showAnswer && isCorrect && (
                          <span className="ml-auto text-green-600 font-semibold">Correct!</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {!showAnswer ? (
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null || submittingAnswer}
                  className="w-full"
                >
                  {submittingAnswer ? '⏳ Submitting...' : 'Submit Answer'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg text-center font-semibold ${
                    isCorrect 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {isCorrect ? '🎉 Correct!' : timeLeft === 0 && selectedAnswer === null ? '⏰ Time\'s Up!' : '❌ Incorrect'}
                    {!isCorrect && (
                      <div className="text-sm mt-1 font-normal">
                        {timeLeft === 0 && selectedAnswer === null && (
                          <div className="text-orange-600 dark:text-orange-400 mb-1">-0.5 points for timeout</div>
                        )}
                        The correct answer was: <strong>{question.options[question.correct]}</strong>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Next question in 3 seconds...
                    </div>
                    <Button 
                      onClick={handleNextQuestion}
                      className="w-full"
                    >
                      {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'} (or wait)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-sm font-medium">{currentQuestion + 1} / {questions.length || count}</span>
            </div>
            <Progress value={((currentQuestion + 1) / (questions.length || count)) * 100} className="h-3" />
          </div>
        </div>
      </div>
      
      <ResumeQuizDialog
        open={showResumeDialog}
        onResume={handleResumeQuiz}
        onStartNew={handleStartNewQuiz}
        savedAt={savedProgress?.lastSaved || ''}
        topic={topic}
        progress={savedProgress ? `${savedProgress.currentQuestion + 1}/${savedProgress.questions.length}` : ''}
      />
    </div>
  )
}