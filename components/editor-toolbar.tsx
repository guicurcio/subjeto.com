import { MousePointer2, Square, Circle, Type, Minus, ArrowRight, Image, MoreHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function EditorToolbar() {
  const tools = [
    { icon: MousePointer2, label: 'Select' },
    { icon: Square, label: 'Rectangle' },
    { icon: Circle, label: 'Circle' },
    { icon: Type, label: 'Text' },
    { icon: Minus, label: 'Line' },
    { icon: ArrowRight, label: 'Arrow' },
    { icon: Image, label: 'Image' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-800/50 rounded-md">
      {tools.map((tool, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-zinc-700"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
      <div className="w-px h-6 bg-zinc-700 mx-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-zinc-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  )
}

