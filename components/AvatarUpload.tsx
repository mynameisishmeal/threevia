'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, User } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarUpdate: (avatar: string) => void
}

export default function AvatarUpload({ currentAvatar, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        onAvatarUpdate(data.avatar)
      } else {
        alert(data.error || 'Failed to upload avatar')
      }
    } catch (error) {
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt="Avatar" 
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      
      <div>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.ico"
          onChange={handleFileUpload}
          className="hidden"
          id="avatar-upload"
          disabled={uploading}
        />
        <label htmlFor="avatar-upload">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={uploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Icon'}
            </span>
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-1">PNG, JPEG, ICO (max 2MB)</p>
      </div>
    </div>
  )
}