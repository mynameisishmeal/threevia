// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean
  error?: string
  data?: T
}

export interface QuizApiResponse extends ApiResponse {
  questions?: Question[]
  modelUsed?: string
}

export interface ScoreApiResponse extends ApiResponse {
  points?: number
}

// Quiz Types
export interface Question {
  question: string
  options: string[]
  correct: number
}

export interface QuizConfig {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  mode?: 'solo' | 'multiplayer' | 'gamble'
}

// User Types
export interface User {
  id: string
  username: string
  email?: string
}

export interface UserStats {
  totalQuizzes: number
  totalPoints: number
  averageScore: number
  bestStreak: number
}

// Game Types
export interface GameRoom {
  id: string
  code: string
  hostName: string
  players: Player[]
  topic: string
  difficulty: string
  questionCount: number
  isPrivate: boolean
  status: 'waiting' | 'playing' | 'finished'
  createdAt: string
}

export interface Player {
  name: string
  score: number
  isReady: boolean
  isHost: boolean
}

export interface GambleMatch extends GameRoom {
  betAmount: number
  timePerQuestion: number
  gameRules: string
  winner?: string
}

// UI Types
export type ConversationStep = 'topic' | 'mode' | 'difficulty' | 'questions' | 'generating'

export interface Message {
  type: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Form Types
export interface LoginForm {
  username: string
  password: string
  isLogin: boolean
}

export interface CreateRoomForm {
  playerName: string
  isPrivate: boolean
  timePerQuestion: number
}

export interface JoinRoomForm {
  roomCode: string
  playerName: string
}

// Event Types
export interface QuizEvent {
  type: 'answer_submitted' | 'question_changed' | 'quiz_completed'
  data: any
}

export interface MultiplayerEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'game_ended'
  data: any
}