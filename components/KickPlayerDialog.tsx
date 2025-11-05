'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface KickPlayerDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  playerName: string
}

export default function KickPlayerDialog({ open, onClose, onConfirm, playerName }: KickPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>⚠️ Kick Player</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>Are you sure you want to kick <strong>{playerName}</strong> from the room?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} variant="destructive" className="flex-1">
              Kick Player
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}