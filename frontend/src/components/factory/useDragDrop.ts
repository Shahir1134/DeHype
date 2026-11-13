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
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const currentItemIdRef = useRef<string | null>(null)
  const selectedItemRef = useRef<string | null>(null)

  useEffect(() => {
    selectedItemRef.current = selectedItem
  }, [selectedItem])

  // Create ghost element
  useEffect(() => {
    const ghost = document.createElement('div')
    ghost.id = 'drag-ghost'
    ghost.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none;
      display: none; transform: translate(-50%, -50%) scale(1.1);
      background: rgba(79,142,247,0.95); color: white;
      padding: 8px 14px; border-radius: 12px; font-size: 14px;
      font-weight: 600; white-space: nowrap; box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      transition: transform 0.08s ease; backdrop-filter: blur(4px);
    `
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    return () => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost)
      }
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent, itemId: string, label: string) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    dragStartPos.current = { x: e.clientX, y: e.clientY }
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    isDraggingRef.current = false
    currentItemIdRef.current = itemId

    const ghost = ghostRef.current
    if (ghost) {
      ghost.textContent = label
      ghost.style.display = 'block'
      ghost.style.left = `${e.clientX}px`
      ghost.style.top = `${e.clientY}px`
      // On mobile touch, float the ghost above the user's thumb so it is visible
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        ghost.style.transform = 'translate(-50%, -140%) scale(1.12)'
      } else {
        ghost.style.transform = 'translate(-50%, -50%) scale(1.08)'
      }
    }

    setDragState({ itemId, x: e.clientX, y: e.clientY })
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!currentItemIdRef.current) return

    lastPosRef.current = { x: e.clientX, y: e.clientY }

    const dx = e.clientX - (dragStartPos.current?.x ?? e.clientX)
    const dy = e.clientY - (dragStartPos.current?.y ?? e.clientY)
    // 14px threshold to distinguish deliberate drag from touch tap jitter
    if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > 14) {
      isDraggingRef.current = true
    }

    const ghost = ghostRef.current
    if (ghost && isDraggingRef.current) {
      ghost.style.left = `${e.clientX}px`
      ghost.style.top = `${e.clientY}px`
    }
  }, [])

  const autoDropTargetRef = useRef<Record<string, string>>({})
  const lastDropTimeRef = useRef<number>(0)

  const safeOnDrop = useCallback((itemId: string, targetId: string) => {
    const now = Date.now()
    if (now - lastDropTimeRef.current < 280) return // Prevent duplicate drop events within 280ms
    lastDropTimeRef.current = now
    onDrop(itemId, targetId)
  }, [onDrop])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.display = 'none'

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    const activeItemId = currentItemIdRef.current

    if (activeItemId) {
      if (isDraggingRef.current) {
        // Find drop target under pointer (checking .closest('[data-drop-target]') for nested child elements)
        const dropX = (e.clientX !== 0 || e.clientY !== 0) ? e.clientX : lastPosRef.current.x
        const dropY = (e.clientX !== 0 || e.clientY !== 0) ? e.clientY : lastPosRef.current.y
        const els = document.elementsFromPoint(dropX, dropY)
        
        let dropSuccess = false
        for (const el of els) {
          const dropTargetEl = (el as HTMLElement).closest?.('[data-drop-target]') as HTMLElement | null
          const targetId = dropTargetEl?.dataset?.dropTarget
          if (targetId) {
            safeOnDrop(activeItemId, targetId)
            dropSuccess = true
            break
          }
        }

        // If drag didn't hit a valid target, check auto-drop or keep selected for tap-to-place fallback
        if (!dropSuccess) {
          const autoTarget = autoDropTargetRef.current[activeItemId]
          if (autoTarget) {
            safeOnDrop(activeItemId, autoTarget)
          } else {
            setSelectedItem(prev => prev === activeItemId ? null : activeItemId)
          }
        }
      } else {
        // Clean single tap detected: if an auto-drop target is registered for this item, drop exactly once!
        const autoTarget = autoDropTargetRef.current[activeItemId]
        if (autoTarget) {
          safeOnDrop(activeItemId, autoTarget)
          setSelectedItem(null)
        } else {
          setSelectedItem(prev => prev === activeItemId ? null : activeItemId)
        }
      }
    }

    setDragState({ itemId: null, x: 0, y: 0 })
    isDraggingRef.current = false
    dragStartPos.current = null
    currentItemIdRef.current = null
  }, [safeOnDrop])

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.display = 'none'
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
    setDragState({ itemId: null, x: 0, y: 0 })
    isDraggingRef.current = false
    dragStartPos.current = null
    currentItemIdRef.current = null
  }, [])

  const handleTargetTap = useCallback((targetId: string) => {
    const currentSelected = selectedItemRef.current
    if (currentSelected) {
      safeOnDrop(currentSelected, targetId)
      setSelectedItem(null)
    }
  }, [safeOnDrop])

  const getDragProps = useCallback((itemId: string, label: string, autoDropTarget?: string) => {
    if (autoDropTarget) {
      autoDropTargetRef.current[itemId] = autoDropTarget
    }
    return {
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, itemId, label),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      style: {
        touchAction: 'none',
        userSelect: 'none' as const,
        WebkitUserSelect: 'none' as const,
        cursor: 'grab',
      },
      'data-drag-item': itemId,
      className: selectedItem === itemId ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-lg' : '',
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, selectedItem])

  const getDropProps = useCallback((targetId: string) => ({
    'data-drop-target': targetId,
    onClick: () => handleTargetTap(targetId),
    onPointerUp: (e: React.PointerEvent) => {
      // Immediate tap on touch screens without waiting for delayed click
      if (selectedItemRef.current) {
        handleTargetTap(targetId)
      }
    },
    className: selectedItem ? 'ring-2 ring-dashed ring-cyan-400 animate-pulse' : '',
  }), [handleTargetTap, selectedItem])

  return {
    dragItem: dragState.itemId,
    selectedItem,
    isDragging: isDraggingRef.current,
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
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch { /* ignore */ }
}
