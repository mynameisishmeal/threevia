'use client'

import { useState, useEffect } from 'react'

interface TrendingTopic {
  topic: string
  searchCount: number
}

interface TrendingTopicsProps {
  onTopicSelect: (topic: string) => void
}

export default function TrendingTopics({ onTopicSelect }: TrendingTopicsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendingTopics()
  }, [])

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch('/api/trending-topics')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (error) {
      console.error('Failed to fetch trending topics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
          🔥
          Trending Topics
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-32 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
        🔥
        Trending Topics
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {topics.map((topic, index) => (
          <button
            key={topic.topic}
            onClick={() => onTopicSelect(topic.topic)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 text-orange-800 dark:text-orange-200 rounded-full border border-orange-200 dark:border-orange-800 hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-800/30 dark:hover:to-red-800/30 transition-all whitespace-nowrap flex-shrink-0"
          >
            <span className="text-xs font-bold">#{index + 1}</span>
            <span className="text-sm font-medium">{topic.topic}</span>
            <span className="text-xs bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded-full">
              {topic.searchCount}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}