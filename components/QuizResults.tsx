'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, ArrowLeft, Star, Award } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { toast } from '@/components/ui/toast'

interface QuizResultsProps {
  score: number
  totalQuestions: number
  topic: string
  difficulty: string
  onTryAgain: () => void
  onNewQuiz: () => void
}

export default function QuizResults({ 
  score, 
  totalQuestions, 
  topic, 
  difficulty, 
  onTryAgain, 
  onNewQuiz 
}: QuizResultsProps) {
  const { user } = useAuth()
  const [points, setPoints] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  
  const percentage = Math.round((score / totalQuestions) * 100)

  useEffect(() => {
    if (user) {
      saveScore()
    }
    getAIResponse()
    if (percentage >= 80) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [user])

  const getAIResponse = async () => {
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'encouragement',
          data: { score, percentage, difficulty }
        })
      })
      const data = await response.json()
      setAiResponse(data.response)
    } catch (error) {
      console.error('Failed to get AI response:', error)
    }
  }

  const saveScore = async () => {
    if (!user || saving) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topic,
          score,
          totalQuestions,
          difficulty
        })
      })
      
      const data = await response.json()
      if (data.points) {
        setPoints(data.points)
        toast(`🎉 Earned ${data.points} points!`, 'success')
      }
    } catch (error) {
      console.error('Failed to save score:', error)
      toast('Failed to save score', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative overflow-hidden">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="animate-bounce text-4xl absolute top-2 left-4">🎉</div>
              <div className="animate-bounce text-3xl absolute top-8 right-6" style={{animationDelay: '0.2s'}}>⭐</div>
              <div className="animate-bounce text-2xl absolute top-12 left-12" style={{animationDelay: '0.4s'}}>🏆</div>
              <div className="animate-bounce text-3xl absolute top-4 right-12" style={{animationDelay: '0.6s'}}>💎</div>
            </div>
          )}
          <div className={`${percentage >= 80 ? 'animate-pulse' : ''}`}>
            <Trophy className={`h-16 w-16 mx-auto mb-4 ${
              percentage >= 80 ? 'text-blue-400' : 
              percentage >= 60 ? 'text-blue-500' : 'text-gray-400'
            }`} />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {percentage >= 80 ? 'LEGENDARY!' : percentage >= 60 ? 'GREAT JOB!' : 'KEEP GRINDING!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {score}/{totalQuestions}
            </div>
            <div className="text-2xl font-semibold">
              {percentage}% Score
            </div>
          </div>
          
          {aiResponse && (
            <div className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <div className="text-lg font-bold text-cyan-800 dark:text-cyan-200 animate-pulse">
                {aiResponse}
              </div>
            </div>
          )}
          
          {/* Points Display */}
          {user && points !== null && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-blue-500" />
                <span className="font-bold text-xl text-green-800 dark:text-green-200">
                  🎯 +{points} Points Earned!
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-300">
                {difficulty === 'hard' ? '1.5x' : difficulty === 'medium' ? '1.2x' : '1x'} difficulty bonus applied
              </p>
            </div>
          )}
          
          {/* Login Reminder for Non-Users */}
          {!user && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-xl text-blue-800 dark:text-blue-200">
                  💰 Missed {Math.round(score * 10 * (difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1))} Points!
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                Login to save progress and earn rewards
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/'} 
                className="text-xs"
              >
                Go Back to Login
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            <Button onClick={onTryAgain} className="w-full">
              Try Again
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onNewQuiz} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Quiz
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const shareText = `I just scored ${score}/${totalQuestions} (${percentage}%) on a ${topic} quiz! 🧠\n\nTry it yourself at:`
                  const shareUrl = window.location.origin
                  if (navigator.share) {
                    navigator.share({ title: 'Threevia Quiz', text: shareText, url: shareUrl })
                  } else {
                    navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
                    toast('Results copied to clipboard!', 'success')
                  }
                }}
                className="flex-1"
              >
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}