import { useRef, useState, useCallback, useEffect } from 'react'

interface DragState {
  itemId: string | null
  x: number
  y: number
}

interface UseDragDropOptions {
  onDrop: (itemId: string, targetId: string) => void
}

export function useDragDrop({ onDrop }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({ itemId: null, x: 0, y: 0 })
  const [selectedItem, setSelectedItem] = useState<string | null>(null) // tap-to-select fallback
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  // Create ghost element
  useEffect(() => {
    const ghost = document.createElement('div')
    ghost.id = 'drag-ghost'
    ghost.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none;
      display: none; transform: translate(-50%, -50%) scale(1.1);
      background: rgba(79,142,247,0.9); color: white;
      padding: 8px 14px; border-radius: 12px; font-size: 14px;
      font-weight: 600; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      transition: transform 0.1s ease;
    `
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    return () => { document.body.removeChild(ghost) }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent, itemId: string, label: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false

    const ghost = ghostRef.current
    if (ghost) {
      ghost.textContent = label
      ghost.style.display = 'block'
      ghost.style.left = `${e.clientX}px`
      ghost.style.top = `${e.clientY}px`
    }

    setDragState({ itemId, x: e.clientX, y: e.clientY })
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.itemId) return

    const dx = e.clientX - (dragStartPos.current?.x ?? e.clientX)
    const dy = e.clientY - (dragStartPos.current?.y ?? e.clientY)
    if (!isDragging.current && Math.sqrt(dx * dx + dy * dy) > 8) {
      isDragging.current = true
    }

    setDragState(s => ({ ...s, x: e.clientX, y: e.clientY }))

    const ghost = ghostRef.current
    if (ghost && isDragging.current) {
      ghost.style.left = `${e.clientX}px`
      ghost.style.top = `${e.clientY}px`
    }
  }, [dragState.itemId])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.display = 'none'

    if (!isDragging.current && dragState.itemId) {
      // Tap mode: select item instead of dropping
      setSelectedItem(prev => prev === dragState.itemId ? null : dragState.itemId)
    }

    // Find drop target under pointer
    if (isDragging.current && dragState.itemId) {
      const els = document.elementsFromPoint(e.clientX, e.clientY)
      for (const el of els) {
        const targetId = (el as HTMLElement).dataset?.dropTarget
        if (targetId) {
          onDrop(dragState.itemId, targetId)
          break
        }
      }
    }

    setDragState({ itemId: null, x: 0, y: 0 })
    isDragging.current = false
    dragStartPos.current = null
  }, [dragState.itemId, onDrop])

  const handleTargetTap = useCallback((targetId: string) => {
    if (selectedItem) {
      onDrop(selectedItem, targetId)
      setSelectedItem(null)
    }
  }, [selectedItem, onDrop])

  const getDragProps = useCallback((itemId: string, label: string) => ({
    onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, itemId, label),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    style: { touchAction: 'none', userSelect: 'none' as const, cursor: 'grab' },
    'data-drag-item': itemId,
    className: selectedItem === itemId ? 'ring-2 ring-blue-400 ring-offset-2' : '',
  }), [handlePointerDown, handlePointerMove, handlePointerUp, selectedItem])

  const getDropProps = useCallback((targetId: string) => ({
    'data-drop-target': targetId,
    onClick: () => handleTargetTap(targetId),
    className: selectedItem ? 'ring-2 ring-dashed ring-blue-300' : '',
  }), [handleTargetTap, selectedItem])

  return {
    dragItem: dragState.itemId,
    selectedItem,
    isDragging: isDragging.current,
    getDragProps,
    getDropProps,
  }
}

// ── Sound utilities ──────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioCtx
}

export function playThunk() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch { /* ignore */ }
}

export function playWobble() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(400, ctx.currentTime + 0.03)
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch { /* ignore */ }
}
