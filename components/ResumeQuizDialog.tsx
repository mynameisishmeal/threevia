'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ResumeQuizDialogProps {
  open: boolean
  onResume: () => void
  onStartNew: () => void
  savedAt: string
  topic: string
  progress: string
}

export default function ResumeQuizDialog({ open, onResume, onStartNew, savedAt, topic, progress }: ResumeQuizDialogProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📚 Resume Quiz?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div>Found saved progress for <strong>{topic}</strong></div>
            <div className="text-sm text-gray-500">
              Saved: {formatDate(savedAt)} • Progress: {progress}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onStartNew} className="w-full sm:w-auto">
              Start New Quiz
            </Button>
            <Button onClick={onResume} className="w-full sm:w-auto">
              Resume Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}