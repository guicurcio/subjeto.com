'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DrawingCanvasProps {
  width: number
  height: number
}

type DrawingTool = 'pencil' | 'line' | 'rectangle' | 'circle'

export function DrawingCanvas({ width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [tool, setTool] = useState<DrawingTool>('pencil')
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.strokeStyle = color
    context.lineWidth = 2
    context.lineCap = 'round'
  }, [color])

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setStartPoint({ x, y })
    if (tool === 'pencil') {
      draw(event)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setStartPoint(null)
    const context = canvasRef.current?.getContext('2d')
    if (context) {
      context.beginPath()
    }
  }

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (tool === 'pencil') {
      context.lineTo(x, y)
      context.stroke()
      context.beginPath()
      context.moveTo(x, y)
    } else if (startPoint) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      context.putImageData(imageData, 0, 0)
      context.beginPath()
      switch (tool) {
        case 'line':
          context.moveTo(startPoint.x, startPoint.y)
          context.lineTo(x, y)
          break
        case 'rectangle':
          context.rect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y)
          break
        case 'circle':
          const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2))
          context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
          break
      }
      context.stroke()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context || !canvas) return

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        className="border border-zinc-700 rounded-md"
      />
      <div className="flex items-center gap-2 mt-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded-md cursor-pointer"
        />
        <Select value={tool} onValueChange={(value) => setTool(value as DrawingTool)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pencil">Pencil</SelectItem>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="rectangle">Rectangle</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={clearCanvas} variant="outline" size="sm">
          Clear Canvas
        </Button>
      </div>
    </div>
  )
}

