'use client'

import { useState, useEffect } from 'react'
import { Brain, Trophy, Upload, Zap, User, LogIn, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import LoginModal from '@/components/LoginModal'
import TrendingTopics from '@/components/TrendingTopics'
import MultiplayerModal from '@/components/MultiplayerModal'

const categories = [
  { name: 'Nigeria Constitution', icon: '⚖️', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { name: 'Bible Stories', icon: '📖', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { name: 'African Geography', icon: '🌍', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { name: 'Mathematics', icon: '🔢', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { name: 'Science', icon: '🧪', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  { name: 'History', icon: '🏛️', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { name: 'Literature', icon: '📚', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
  { name: 'Sports', icon: '⚽', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
]

function UserButton({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Dashboard
        </Button>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" onClick={onLoginClick}>
      <LogIn className="h-4 w-4 mr-2" />
      Login (Optional)
    </Button>
  )
}

export default function HomePage() {
  const [customTopic, setCustomTopic] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(10)
  const [showLogin, setShowLogin] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [startingQuiz, setStartingQuiz] = useState(false)

  useEffect(() => {
    // Load dark mode from localStorage on mount
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // Save and apply dark mode changes
    localStorage.setItem('darkMode', darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false)
      }
      if (e.key === 'Enter' && (customTopic || selectedCategory || fileContent)) {
        handleStartQuiz()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLogin, customTopic, selectedCategory, fileContent])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setFileContent(text)
        setCustomTopic('')
        setSelectedCategory('')
      }
      reader.readAsText(file)
    }
  }

  const handleStartQuiz = async () => {
    const topic = customTopic || selectedCategory || (uploadedFile ? uploadedFile.name : '')
    if (!topic && !fileContent) return
    
    setStartingQuiz(true)
    
    // Track topic for trending
    if (topic && !fileContent) {
      try {
        await fetch('/api/track-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        })
      } catch (error) {
        console.error('Failed to track topic:', error)
      }
    }
    
    const params = new URLSearchParams({
      topic,
      difficulty,
      count: questionCount.toString()
    })
    
    if (fileContent) {
      params.append('sourceText', fileContent)
    }
    
    window.location.href = `/quiz?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Threevia</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <UserButton onLoginClick={() => setShowLogin(!showLogin)} />
          </div>
        </header>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generate AI Quizzes Instantly</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose a topic below and test your knowledge with AI-generated questions</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Trending Topics */}
          <TrendingTopics onTopicSelect={(topic) => {
            setCustomTopic(topic)
            setSelectedCategory('')
          }} />
          
          {/* Quick Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Popular Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    setSelectedCategory(category.name)
                    setCustomTopic('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedCategory === category.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${category.color}`}>
                      {category.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-topic">Or Enter Any Topic</Label>
                  <Input
                    id="custom-topic"
                    placeholder="e.g., Space Travel, Cooking, Movies, Programming..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value)
                      setSelectedCategory('')
                    }}
                    className="text-lg p-4 h-12"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Difficulty</Label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {[{id: 'easy', label: 'Easy', icon: '🟢'}, {id: 'medium', label: 'Medium', icon: '🟡'}, {id: 'hard', label: 'Hard', icon: '🔴'}].map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setDifficulty(diff.id)}
                          className={`px-3 py-2 text-sm rounded-md transition-all ${
                            difficulty === diff.id
                              ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                              : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {diff.icon} {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Questions</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      placeholder="Enter number (1-50)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleStartQuiz}
                    className="h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    disabled={!customTopic && !selectedCategory && !fileContent || startingQuiz}
                  >
                    {startingQuiz ? '⏳ Starting...' : '🚀 Solo Quiz'}
                  </Button>
                  <Button 
                    onClick={() => setShowMultiplayer(true)}
                    className="h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    disabled={!customTopic && !selectedCategory && !fileContent}
                  >
                    🎮 Multiplayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label>Or Upload Your Own Content</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload a text file (.txt, .md) to generate questions from your content
                  </p>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    type="button"
                  >
                    Choose File
                  </Button>
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      ✅ {uploadedFile.name} uploaded ({Math.round(fileContent.length / 1000)}k chars)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Modal */}
          <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
          
          {/* Multiplayer Modal */}
          <MultiplayerModal 
            open={showMultiplayer} 
            onClose={() => setShowMultiplayer(false)}
            topic={customTopic || selectedCategory || 'General Knowledge'}
            difficulty={difficulty}
            questionCount={questionCount}
          />
        </div>

        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            ✨ Powered by AI • 🆓 Completely Free • ⚡ Instant Generation • ❤️ Made with love by{' '}
            <a 
              href="https://gigme.space" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
            >
              gigme
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}