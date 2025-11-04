'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Target, TrendingUp, ArrowLeft, Award } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface UserStats {
  totalPoints: number
  quizzesCompleted: number
  averageScore: number
  bestStreak: number
}

interface QuizResult {
  topic: string
  score: number
  totalQuestions: number
  difficulty: string
  completedAt: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentQuizzes, setRecentQuizzes] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const [statsRes, quizzesRes] = await Promise.all([
        fetch('/api/user-stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
        }),
        fetch('/api/user-quizzes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
        })
      ])

      const statsData = await statsRes.json()
      const quizzesData = await quizzesRes.json()

      setStats(statsData)
      setRecentQuizzes(quizzesData.quizzes || [])
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please login to view your dashboard</p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Welcome back, {user.email}!</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quiz
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats?.totalPoints || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats?.quizzesCompleted || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats?.averageScore || 0}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats?.bestStreak || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {recentQuizzes.slice(0, 5).map((quiz, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{quiz.topic}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {quiz.difficulty} • {new Date(quiz.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{quiz.score}/{quiz.totalQuestions}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No quizzes completed yet. Start your first quiz!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center p-3 rounded-lg ${(stats?.quizzesCompleted || 0) >= 1 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <Award className={`h-6 w-6 mr-3 ${(stats?.quizzesCompleted || 0) >= 1 ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">First Quiz</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete your first quiz</p>
                  </div>
                </div>

                <div className={`flex items-center p-3 rounded-lg ${(stats?.totalPoints || 0) >= 100 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <Star className={`h-6 w-6 mr-3 ${(stats?.totalPoints || 0) >= 100 ? 'text-yellow-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Point Collector</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Earn 100 points</p>
                  </div>
                </div>

                <div className={`flex items-center p-3 rounded-lg ${(stats?.quizzesCompleted || 0) >= 10 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <Trophy className={`h-6 w-6 mr-3 ${(stats?.quizzesCompleted || 0) >= 10 ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Quiz Master</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete 10 quizzes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}