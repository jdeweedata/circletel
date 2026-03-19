'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type ReactSignatureCanvas from 'react-signature-canvas'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignaturePad = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
}) as any

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null, mode: 'drawn' | 'typed') => void
  disabled?: boolean
}

export function SignatureCanvas({ onSignatureChange, disabled = false }: SignatureCanvasProps) {
  const [mode, setMode] = useState<'drawn' | 'typed'>('drawn')
  const [typedName, setTypedName] = useState('')
  const sigCanvasRef = useRef<ReactSignatureCanvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(400)

  // Measure container width for responsive canvas
  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Switch mode and clear
  const handleModeSwitch = useCallback(
    (newMode: 'drawn' | 'typed') => {
      if (newMode === mode) return
      setMode(newMode)
      if (newMode === 'drawn') {
        setTypedName('')
        onSignatureChange(null, 'drawn')
      } else {
        if (sigCanvasRef.current) {
          sigCanvasRef.current.clear()
        }
        onSignatureChange(null, 'typed')
      }
    },
    [mode, onSignatureChange]
  )

  // Draw mode: stroke end
  const handleStrokeEnd = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.toDataURL()
      onSignatureChange(dataUrl, 'drawn')
    }
  }, [onSignatureChange])

  // Draw mode: clear
  const handleClearDrawn = useCallback(() => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear()
    }
    onSignatureChange(null, 'drawn')
  }, [onSignatureChange])

  // Type mode: render text to hidden canvas and export
  const handleTypedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setTypedName(value)

      if (!value.trim()) {
        onSignatureChange(null, 'typed')
        return
      }

      const canvas = hiddenCanvasRef.current
      if (!canvas) return

      canvas.width = canvasWidth
      canvas.height = 150
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = "32px 'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive"
      ctx.fillStyle = '#000000'
      ctx.textBaseline = 'middle'
      ctx.fillText(value, 20, canvas.height / 2)

      const dataUrl = canvas.toDataURL('image/png')
      onSignatureChange(dataUrl, 'typed')
    },
    [onSignatureChange, canvasWidth]
  )

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      {/* Mode toggle tabs */}
      <div className="flex mb-3">
        <button
          type="button"
          onClick={() => handleModeSwitch('drawn')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
            mode === 'drawn'
              ? 'bg-circleTel-orange text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('typed')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
            mode === 'typed'
              ? 'bg-circleTel-orange text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Type
        </button>
      </div>

      {/* Signature area */}
      <div
        ref={containerRef}
        className="border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ minHeight: '150px' }}
      >
        {mode === 'drawn' ? (
          <SignaturePad
            ref={(ref: ReactSignatureCanvas | null) => {
              sigCanvasRef.current = ref
            }}
            penColor="black"
            backgroundColor="white"
            canvasProps={{
              width: canvasWidth,
              height: 150,
              className: 'rounded-lg',
            }}
            onEnd={handleStrokeEnd}
          />
        ) : (
          <div className="p-4">
            <input
              type="text"
              value={typedName}
              onChange={handleTypedChange}
              placeholder="Type your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent text-sm"
            />
            {typedName.trim() && (
              <div
                className="mt-3 flex items-center justify-center bg-gray-50 rounded-md"
                style={{ minHeight: '80px' }}
              >
                <span
                  style={{
                    fontFamily:
                      "'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive",
                    fontSize: '32px',
                    color: '#000',
                  }}
                >
                  {typedName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear button (draw mode only) */}
      {mode === 'drawn' && (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleClearDrawn}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Hidden canvas for typed signature rendering */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}
