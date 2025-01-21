import React from 'react'
import { Upload } from 'lucide-react'

interface DragDropZoneProps {
  onFilesDrop: (files: File[]) => void
}

export function DragDropZone({ onFilesDrop }: DragDropZoneProps) {
  return (
    <div className="border-2 border-dashed border-blue-500 rounded-md p-4 text-center bg-blue-50 dark:bg-blue-900/20">
      <Upload className="mx-auto h-8 w-8 text-blue-500" />
      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">Drop files here to upload</p>
    </div>
  )
}

