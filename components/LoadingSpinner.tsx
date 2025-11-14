import { Brain } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-20 w-20'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Brain className={`${sizeClasses[size]} text-blue-400 animate-pulse`} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
      </div>
      <p className={`${textSizeClasses[size]} font-medium text-slate-600 dark:text-slate-400`}>
        {message}
      </p>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}