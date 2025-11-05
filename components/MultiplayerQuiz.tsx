'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Trophy } from 'lucide-react'

interface MultiplayerQuizProps {
  room: any
  playerName: string
  roomCode: string
}

export default function MultiplayerQuiz({ room, playerName, roomCode }: MultiplayerQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [allAnswered, setAllAnswered] = useState(false)

  const currentQuestion = room.questions[room.currentQuestion]
  const playerAnswer = room.playerAnswers?.[playerName]?.[`q${room.currentQuestion}`]

  useEffect(() => {
    setTimeLeft(30)
    setSelectedAnswer(null)
    setHasAnswered(false)
    setShowResults(false)
  }, [room.currentQuestion])

  useEffect(() => {
    if (hasAnswered || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setHasAnswered(true)
          checkAllAnswered()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [hasAnswered, timeLeft])

  const checkAllAnswered = () => {
    const answeredCount = Object.keys(room.playerAnswers || {}).filter(player => 
      room.playerAnswers[player] && room.playerAnswers[player][`q${room.currentQuestion}`]
    ).length
    
    if (answeredCount === room.players.length) {
      setAllAnswered(true)
      setTimeout(() => nextQuestion(), 3000) // Auto-advance after 3 seconds
    }
  }

  // Check for updates when room data changes
  useEffect(() => {
    if (hasAnswered && !allAnswered) {
      checkAllAnswered()
    }
  }, [room.playerAnswers, hasAnswered, allAnswered])

  const nextQuestion = async () => {
    try {
      await fetch('/api/multiplayer/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode })
      })
    } catch (error) {
      console.error('Failed to advance question:', error)
    }
  }

  const submitAnswer = async (answerIndex: number) => {
    if (hasAnswered) return
    
    setSelectedAnswer(answerIndex)
    setHasAnswered(true)
    
    try {
      await fetch('/api/multiplayer/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerName,
          questionIndex: room.currentQuestion,
          answerIndex,
          timeLeft
        })
      })
      checkAllAnswered()
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  if (room.status === 'finished') {
    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
    
    return (
      <div className="mt-6">
        <div className="text-center mb-6">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
        </div>
        
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div key={player.name} className={`flex items-center justify-between p-4 rounded-lg ${
              index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
              index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
              index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
              'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <span className={`font-medium ${player.name === playerName ? 'text-purple-600' : ''}`}>
                  {player.name}
                </span>
              </div>
              <div className="text-xl font-bold">{player.score} pts</div>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={() => window.location.href = '/'}
          className="w-full mt-6"
        >
          New Quiz
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Question {room.currentQuestion + 1} of {room.questions.length}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className={`font-mono text-lg ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-xl font-medium mb-6">
            {currentQuestion.question}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correct
              const showAnswer = hasAnswered || timeLeft === 0
              
              return (
                <button
                  key={index}
                  onClick={() => submitAnswer(index)}
                  disabled={hasAnswered || timeLeft === 0}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    showAnswer
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isSelected
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 opacity-60'
                      : isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{String.fromCharCode(65 + index)}. {option}</span>
                    {showAnswer && isCorrect && (
                      <span className="text-green-600 font-semibold">✓ Correct</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {(hasAnswered || timeLeft === 0) && (
            <div className="mt-4 space-y-3">
              {playerAnswer && (
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="font-semibold">
                    {playerAnswer.correct ? '🎉 Correct!' : '❌ Incorrect'}
                  </div>
                  <div className="text-sm text-gray-600">
                    +{playerAnswer.points} points
                  </div>
                </div>
              )}
              
              {allAnswered ? (
                <div className="text-center text-green-600 font-medium">
                  All players answered! Next question in 3 seconds...
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  Waiting for other players... ({Object.keys(room.playerAnswers || {}).filter(player => 
                    room.playerAnswers[player] && room.playerAnswers[player][`q${room.currentQuestion}`]
                  ).length}/{room.players.length} answered)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Leaderboard */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="font-semibold mb-3">Live Scores</h3>
          <div className="space-y-2">
            {[...room.players].sort((a, b) => b.score - a.score).map((player, index) => (
              <div key={player.name} className="flex items-center justify-between">
                <span className={`${player.name === playerName ? 'font-bold text-purple-600' : ''}`}>
                  #{index + 1} {player.name}
                </span>
                <span className="font-semibold">{player.score} pts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}