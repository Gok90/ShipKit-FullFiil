'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'

// ═══════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════

type PickStatus = 'ok' | 'short' | 'out' | 'unmatched'

interface PickItem {
  color: string
  colorHex: string | null
  reqQty: number
  stock: number | null
  status: PickStatus
  checkKey: string
}

interface PackGroup {
  packName: string
  items: PickItem[]
}

interface PickListData {
  totalToPull: number
  short: number
  out: number
  groups: PackGroup[]
}

// Animation config: [0.22, 1, 0.36, 1] confident ease-out
const EASING = [0.22, 1, 0.36, 1] as const
const DURATION = { hover: 0.12, state: 0.25, progress: 0.5 } as const

// ═══════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════

const MOCK_PICK_DATA: PickListData = {
  totalToPull: 30,
  short: 2,
  out: 1,
  groups: [
    {
      packName: '2pk',
      items: [
        { color: 'Black', colorHex: '#1a1a1a', reqQty: 8, stock: 15, status: 'ok', checkKey: 'pick_Black_2pk' },
        { color: 'Navy', colorHex: '#001a4d', reqQty: 5, stock: 3, status: 'short', checkKey: 'pick_Navy_2pk' },
        { color: 'Charcoal', colorHex: '#444444', reqQty: 3, stock: 12, status: 'ok', checkKey: 'pick_Charcoal_2pk' },
      ],
    },
    {
      packName: '4pk',
      items: [
        { color: 'White', colorHex: '#f5f5f5', reqQty: 7, stock: 20, status: 'ok', checkKey: 'pick_White_4pk' },
        { color: 'Red', colorHex: '#dc2626', reqQty: 4, stock: 0, status: 'out', checkKey: 'pick_Red_4pk' },
        { color: 'Blue', colorHex: '#2563eb', reqQty: 2, stock: 8, status: 'ok', checkKey: 'pick_Blue_4pk' },
      ],
    },
    {
      packName: '4pk NoLanyard',
      items: [
        { color: 'Grey', colorHex: '#808080', reqQty: 1, stock: 7, status: 'ok', checkKey: 'pick_Grey_nl' },
      ],
    },
    {
      packName: 'UNMATCHED',
      items: [
        { color: 'Coral', colorHex: null, reqQty: 2, stock: 0, status: 'unmatched', checkKey: 'pick_Coral_um' },
        { color: 'Sage', colorHex: null, reqQty: 1, stock: 0, status: 'unmatched', checkKey: 'pick_Sage_um' },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════
// MOTION VARIANTS
// ═══════════════════════════════════════════════

const rowStaggerVariants = {
  hidden: { y: 4, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: Math.min(i * 0.025, 0.5),
      duration: 0.4,
      ease: EASING,
    },
  }),
}

const qtyPulseVariants = {
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: EASING },
  },
}

const chevronVariants = {
  open: { rotate: 0, transition: { duration: 0.2, ease: EASING } },
  closed: { rotate: -90, transition: { duration: 0.2, ease: EASING } },
}

const groupDoneVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASING } },
}

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

export default function PickList({ data = MOCK_PICK_DATA }: { data?: PickListData }) {
  const [checkState, setCheckState] = useState<Record<string, boolean>>({})
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPickingMode, setIsPickingMode] = useState(false)
  const [pulseKey, setPulseKey] = useState<string | null>(null)

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored: Record<string, boolean> = {}
    data.groups.forEach(group => {
      group.items.forEach(item => {
        const val = sessionStorage.getItem(`pick_${item.checkKey}`)
        if (val === 'true') stored[item.checkKey] = true
      })
    })
    setCheckState(stored)

    // Set first unchecked as focused
    const firstUnchecked = data.groups
      .flatMap(g => g.items)
      .find(item => !stored[item.checkKey])
    if (firstUnchecked) setFocusedKey(firstUnchecked.checkKey)
  }, [data])

  // Flatten all items for navigation
  const allItems = useMemo(() => data.groups.flatMap(g => g.items), [data])

  const toggleRow = useCallback((checkKey: string) => {
    const newState = !checkState[checkKey]
    setCheckState(prev => ({ ...prev, [checkKey]: newState }))
    sessionStorage.setItem(`pick_${checkKey}`, String(newState))

    // Trigger qty pulse
    setPulseKey(checkKey)
    setTimeout(() => setPulseKey(null), 300)

    // Auto-advance focus to next unchecked
    if (newState) {
      const currentIdx = allItems.findIndex(item => item.checkKey === checkKey)
      const nextUnchecked = allItems
        .slice(currentIdx + 1)
        .find(item => !checkState[item.checkKey] || checkKey === item.checkKey)
      if (nextUnchecked) setFocusedKey(nextUnchecked.checkKey)
    }
  }, [checkState, allItems])

  const focusNext = useCallback(() => {
    if (!focusedKey) return
    const currentIdx = allItems.findIndex(item => item.checkKey === focusedKey)
    const nextUnchecked = allItems
      .slice(currentIdx + 1)
      .find(item => !checkState[item.checkKey])
    if (nextUnchecked) setFocusedKey(nextUnchecked.checkKey)
  }, [focusedKey, allItems, checkState])

  const focusPrev = useCallback(() => {
    if (!focusedKey) return
    const currentIdx = allItems.findIndex(item => item.checkKey === focusedKey)
    const prevUnchecked = allItems
      .slice(0, currentIdx)
      .reverse()
      .find(item => !checkState[item.checkKey])
    if (prevUnchecked) setFocusedKey(prevUnchecked.checkKey)
  }, [focusedKey, allItems, checkState])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && focusedKey) {
        e.preventDefault()
        toggleRow(focusedKey)
      } else if (e.code === 'KeyJ' || e.code === 'ArrowDown') {
        e.preventDefault()
        focusNext()
      } else if (e.code === 'KeyK' || e.code === 'ArrowUp') {
        e.preventDefault()
        focusPrev()
      } else if (e.code === 'Escape') {
        setIsPickingMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedKey, toggleRow, focusNext, focusPrev])

  // Calculate progress
  const pickedCount = Object.values(checkState).filter(Boolean).length
  const percentage = data.totalToPull > 0 ? Math.round((pickedCount / data.totalToPull) * 100) : 0
  const isComplete = percentage === 100

  return (
    <div className="pick-list-container">
      {/* HEADER */}
      <div className="pick-list-header">
        <motion.button
          className="pick-chevron"
          onClick={() => setIsCollapsed(!isCollapsed)}
          variants={chevronVariants}
          animate={isCollapsed ? 'closed' : 'open'}
          whileHover={{ opacity: 0.8 }}
        >
          ▼
        </motion.button>

        <div className="pick-title">Pick List</div>

        <div className="pick-summary">
          {data.totalToPull} to pull · {data.short} SHORT · {data.out} OUT
        </div>

        <button
          className={`pick-mode-btn ${isPickingMode ? 'active' : ''}`}
          onClick={() => setIsPickingMode(!isPickingMode)}
        >
          {isPickingMode ? 'Exit Picking Mode' : 'Picking Mode'}
        </button>
      </div>

      {/* PROGRESS STRIP */}
      <div className="pick-progress-wrapper">
        <div className="pick-progress-track">
          <motion.div
            className={`pick-progress-fill ${isComplete ? 'complete' : ''}`}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: DURATION.progress, ease: EASING }}
          />
        </div>
        <div className={`pick-progress-text ${isComplete ? 'complete' : ''}`}>
          {isComplete ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              All picked ✓
            </motion.span>
          ) : (
            `${pickedCount}/${data.totalToPull} · ${percentage}%`
          )}
        </div>
      </div>

      {/* LIST WRAPPER */}
      <motion.div
        className="pick-list-wrapper"
        animate={{ maxHeight: isCollapsed ? 0 : 10000 }}
        transition={{ duration: 0.3, ease: EASING }}
      >
        <div className="pick-list-content">
          {data.groups.length === 0 ? (
            <div className="pick-empty-state">Upload a manifest CSV to see the pick list</div>
          ) : (
            data.groups.map((group, groupIdx) => {
              const isUnmatched = group.packName === 'UNMATCHED'
              const allGroupChecked = group.items.every(item => checkState[item.checkKey])

              return (
                <div key={groupIdx} className="pick-group">
                  <div className={`pick-group-header ${isUnmatched ? 'unmatched' : ''}`}>
                    {group.packName.toUpperCase()}
                    {allGroupChecked && group.items.length > 0 && (
                      <motion.span
                        className="pick-group-done"
                        variants={groupDoneVariants}
                        initial="initial"
                        animate="animate"
                      >
                        done ✦
                      </motion.span>
                    )}
                  </div>

                  {group.items.map((item, itemIdx) => {
                    const isChecked = checkState[item.checkKey]
                    const isFocused = focusedKey === item.checkKey && !isChecked
                    const rowClassName = `pick-row pick-row-${item.status} ${
                      isChecked ? 'checked' : ''
                    } ${isFocused ? 'focused' : ''}`

                    return (
                      <motion.div
                        key={item.checkKey}
                        custom={groupIdx * 20 + itemIdx}
                        variants={rowStaggerVariants}
                        initial="hidden"
                        animate="visible"
                        className={rowClassName}
                        onClick={() => toggleRow(item.checkKey)}
                      >
                        <input
                          type="checkbox"
                          className="pick-checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(item.checkKey)}
                          onClick={e => e.stopPropagation()}
                        />

                        <div
                          className="pick-color-dot"
                          style={item.colorHex ? { backgroundColor: item.colorHex } : { backgroundColor: '#666' }}
                        />

                        <div className="pick-color-info">
                          <div className="pick-color-name">{item.color}</div>
                          {item.stock !== null && <div className="pick-stock-line">stock: {item.stock}</div>}
                        </div>

                        {item.status === 'short' && <span className="pick-badge short">SHORT</span>}
                        {item.status === 'out' && <span className="pick-badge out">OUT</span>}
                        {item.status === 'unmatched' && <span className="pick-badge unmatched">NO MATCH</span>}

                        <motion.div
                          className="pick-qty-badge"
                          key={`pulse-${pulseKey}-${item.checkKey}`}
                          initial={{ scale: 1 }}
                          animate={pulseKey === item.checkKey ? 'pulse' : 'initial'}
                          variants={qtyPulseVariants}
                        >
                          ×{item.reqQty}
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* KEYBOARD HINT STRIP */}
      <div className="pick-kbd-hint">
        <span className="kbd">[space]</span> check · <span className="kbd">[j/↓]</span> next ·{' '}
        <span className="kbd">[k/↑]</span> prev · <span className="kbd">[esc]</span> exit
      </div>
    </div>
  )
}
