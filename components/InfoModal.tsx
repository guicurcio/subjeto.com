"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface InfoModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function InfoModal({ isOpen, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Information</DialogTitle>
          <DialogDescription>
            This is a sample information modal. You can customize this content to provide
            relevant details about your application or any other info you'd like to share
            with your users.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-lg font-medium">Key Features:</h3>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Easy deployment with Vercel</li>
            <li>Sign in with GitHub</li>
            <li>Customizable user interface</li>
            <li>Responsive design</li>
            <li>Built with Next.js and React</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
