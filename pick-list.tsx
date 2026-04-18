import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// ── TYPES ──
type PickStatus = 'ok' | 'short' | 'out' | 'unmatched';

interface PickItem {
  color: string;
  colorHex: string;
  reqQty: number;
  stock: number | null;
  status: PickStatus;
  checkKey: string;
}

interface PackGroup {
  packName: string;
  items: PickItem[];
}

interface PickListData {
  totalToPull: number;
  short: number;
  out: number;
  groups: PackGroup[];
}

// ── MOTION VARIANTS ──
const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.025, 0.5), duration: 0.4 },
  }),
};

const ease = [0.22, 1, 0.36, 1];

// ── MOCK DATA (41 items) ──
const MOCK_DATA: PickListData = {
  totalToPull: 41,
  short: 1,
  out: 1,
  groups: [
    {
      packName: '2pk',
      items: [
        { color: 'Black', colorHex: '#222222', reqQty: 8, stock: 15, status: 'ok', checkKey: 'pick_Black_2pk' },
        { color: 'Red', colorHex: '#dc2626', reqQty: 5, stock: 3, status: 'short', checkKey: 'pick_Red_2pk' },
        { color: 'Blue', colorHex: '#2563eb', reqQty: 2, stock: 10, status: 'ok', checkKey: 'pick_Blue_2pk' },
        { color: 'White', colorHex: '#f5f5f5', reqQty: 3, stock: 20, status: 'ok', checkKey: 'pick_White_2pk' },
      ],
    },
    {
      packName: '4pk',
      items: [
        { color: 'Green', colorHex: '#059669', reqQty: 12, stock: 20, status: 'ok', checkKey: 'pick_Green_4pk' },
        { color: 'Navy', colorHex: '#1e40af', reqQty: 7, stock: 0, status: 'out', checkKey: 'pick_Navy_4pk' },
        { color: 'Purple', colorHex: '#7c3aed', reqQty: 4, stock: 8, status: 'ok', checkKey: 'pick_Purple_4pk' },
        { color: 'Gold', colorHex: '#d97706', reqQty: 1, stock: 5, status: 'ok', checkKey: 'pick_Gold_4pk' },
      ],
    },
    {
      packName: 'unmatched',
      items: [
        { color: 'Charcoal', colorHex: '', reqQty: 3, stock: 0, status: 'unmatched', checkKey: 'pick_Charcoal_unmatched' },
        { color: 'Coral', colorHex: '', reqQty: 1, stock: 0, status: 'unmatched', checkKey: 'pick_Coral_unmatched' },
      ],
    },
  ],
};

// ── PICK ROW COMPONENT ──
const PickRow: React.FC<{
  item: PickItem;
  checked: boolean;
  focused: boolean;
  onCheck: (key: string, value: boolean) => void;
  rowIndex: number;
}> = ({ item, checked, focused, onCheck, rowIndex }) => {
  const [pulseKey, setPulseKey] = useState(0);

  const rowBgColor = () => {
    if (item.status === 'short') return 'from-[#3d2e00] to-[#2d1f42]';
    if (item.status === 'out') return 'from-[#3d1515] to-[#2d1f42]';
    return 'bg-surface-2';
  };

  const rowBorderColor = () => {
    if (item.status === 'short') return 'border-l-yellow-500';
    if (item.status === 'out') return 'border-l-red-500';
    if (focused) return 'border-l-accent shadow-glow';
    return 'border-l-transparent';
  };

  const textColor = () => {
    if (item.status === 'short') return 'text-yellow-400';
    if (item.status === 'out') return 'text-red-400';
    if (item.status === 'unmatched') return 'text-muted';
    return 'text-text';
  };

  const handleCheck = (value: boolean) => {
    onCheck(item.checkKey, value);
    if (value) setPulseKey((k) => k + 1);
  };

  const qtyVariants = {
    rest: { scale: 1 },
    pulse: { scale: 1.15, transition: { duration: 0.3, ease } },
  };

  return (
    <motion.div
      custom={rowIndex}
      initial="hidden"
      animate="visible"
      variants={rowVariants}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg border-l-2 transition-all duration-150
        ${rowBgColor()} ${rowBorderColor()} ${checked ? 'opacity-40' : ''}
        hover:bg-surface-3 cursor-pointer
      `}
      onClick={() => handleCheck(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheck}
        className="h-5 w-5 accent-green cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />

      {item.colorHex ? (
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.colorHex }} />
      ) : (
        <div className="h-3 w-3 rounded-full flex-shrink-0 bg-gray-600" />
      )}

      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${textColor()}`}>{item.color}</div>
        <div className={`text-xs ${textColor()} opacity-70`}>stock: {item.stock}</div>
      </div>

      {item.status === 'short' && <Badge className="bg-yellow-500/20 text-yellow-400 border-0">SHORT</Badge>}
      {item.status === 'out' && <Badge className="bg-red-500/20 text-red-400 border-0">OUT</Badge>}
      {item.status === 'unmatched' && <Badge className="bg-yellow-500/20 text-yellow-400 border-0">NO MATCH</Badge>}

      <motion.div
        key={pulseKey}
        initial="rest"
        animate="pulse"
        variants={qtyVariants}
        className="flex-shrink-0 px-3 py-1 rounded-lg bg-teal/20 text-teal font-mono font-semibold"
      >
        ×{item.reqQty}
      </motion.div>
    </motion.div>
  );
};

// ── PACK GROUP COMPONENT ──
const PackGroup: React.FC<{
  group: PackGroup;
  checked: Record<string, boolean>;
  focusKey: string | undefined;
  onCheck: (key: string, value: boolean) => void;
  startIndex: number;
}> = ({ group, checked, focusKey, onCheck, startIndex }) => {
  const allChecked = group.items.every((item) => checked[item.checkKey]);

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-center gap-2 px-1 border-b border-teal/30 pb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-teal">{group.packName}</span>
        {allChecked && group.items.length > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease }}
            className="text-xs font-semibold text-green italic"
          >
            done ✦
          </motion.span>
        )}
      </div>

      <div className="space-y-1.5">
        {group.items.map((item, idx) => (
          <PickRow
            key={item.checkKey}
            item={item}
            checked={checked[item.checkKey] || false}
            focused={focusKey === item.checkKey}
            onCheck={onCheck}
            rowIndex={startIndex + idx}
          />
        ))}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ──
export default function PickList({ data = MOCK_DATA }: { data?: PickListData }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const saved = sessionStorage.getItem('pick_state');
    return saved ? JSON.parse(saved) : {};
  });

  const [isPickingMode, setIsPickingMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const focusKeyRef = useRef<string | undefined>();

  // Derive focus key (first unchecked item)
  const focusKey = useMemo(() => {
    for (const group of data.groups) {
      for (const item of group.items) {
        if (!checked[item.checkKey]) {
          focusKeyRef.current = item.checkKey;
          return item.checkKey;
        }
      }
    }
    return undefined;
  }, [checked, data.groups]);

  // Persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pick_state', JSON.stringify(checked));
  }, [checked]);

  // Calculate progress
  const allItems = data.groups.flatMap((g) => g.items);
  const pickedCount = allItems.filter((item) => checked[item.checkKey]).length;
  const progressPercent = Math.round((pickedCount / allItems.length) * 100);
  const isComplete = progressPercent === 100;

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPickingMode) return;

      if (e.code === 'Space' && focusKey) {
        e.preventDefault();
        setChecked((prev) => ({ ...prev, [focusKey]: !prev[focusKey] }));
      }

      if (e.code === 'KeyJ' || e.code === 'ArrowDown') {
        e.preventDefault();
        const idx = allItems.findIndex((item) => item.checkKey === focusKey);
        if (idx < allItems.length - 1) {
          focusKeyRef.current = allItems[idx + 1].checkKey;
        }
      }

      if (e.code === 'KeyK' || e.code === 'ArrowUp') {
        e.preventDefault();
        const idx = allItems.findIndex((item) => item.checkKey === focusKey);
        if (idx > 0) {
          focusKeyRef.current = allItems[idx - 1].checkKey;
        }
      }

      if (e.code === 'Escape') {
        setIsPickingMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPickingMode, focusKey, allItems]);

  const handleCheck = (key: string, value: boolean) => {
    setChecked((prev) => ({ ...prev, [key]: value }));
  };

  let rowCount = 0;

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(63,197,231,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-3"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3CfilterTurbulence="0.9" numOctaves="3" result="noise"/%3E%3Crect width="200" height="200" filter="url(%23noise)" opacity="0.05"/%3E%3C/svg%3E")',
        }}
      />

      {/* Dashed corner marks */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute top-8 left-8 w-4 h-4 border-l-2 border-t-2 border-muted" />
        <div className="absolute top-8 right-8 w-4 h-4 border-r-2 border-t-2 border-muted" />
        <div className="absolute bottom-8 left-8 w-4 h-4 border-l-2 border-b-2 border-muted" />
        <div className="absolute bottom-8 right-8 w-4 h-4 border-r-2 border-b-2 border-muted" />
      </div>

      {/* Watermark */}
      <div className="pointer-events-none fixed top-4 right-4 text-xs font-serif italic text-muted opacity-30">
        ops
      </div>

      {/* Main container */}
      <div className="relative mx-auto max-w-sm px-4 py-8">
        <motion.div className="rounded-2xl border border-border/40 bg-surface/60 backdrop-blur shadow-card p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/40">
            <div className="flex-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-2 text-lg font-medium text-text hover:text-accent transition-colors"
              >
                <motion.span
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.2, ease }}
                  className="inline-block"
                >
                  ▼
                </motion.span>
                Pick List
              </button>
              <p className="text-xs text-muted mt-1">
                {data.totalToPull} items · {data.short} SHORT · {data.out} OUT
              </p>
            </div>

            <button
              onClick={() => setIsPickingMode(!isPickingMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isPickingMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-gradient-to-r from-teal to-accent text-bg'
              }`}
            >
              {isPickingMode ? 'Exit Picking' : 'Picking Mode'}
            </button>
          </div>

          {/* Progress bar */}
          {!isCollapsed && (
            <motion.div className="mt-4 space-y-2">
              <div className="h-1 w-full rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  animate={{
                    width: `${progressPercent}%`,
                    background: isComplete
                      ? '#10b981'
                      : 'linear-gradient(90deg, #5ce0d0, #a78bfa)',
                  }}
                  transition={{ duration: 0.5, ease }}
                  className={`h-full ${!isComplete ? 'bg-gradient-to-r from-accent to-secondary' : 'bg-green'}`}
                  style={{
                    backgroundImage: !isComplete
                      ? `linear-gradient(90deg, #5ce0d0, #a78bfa)`
                      : undefined,
                  }}
                />
              </div>
              <p
                className={`text-xs font-mono ${
                  isComplete ? 'italic text-green' : 'text-muted'
                }`}
              >
                {pickedCount} of {allItems.length} picked · {progressPercent}%
              </p>
            </motion.div>
          )}

          {/* Groups */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
              className="mt-6 space-y-4"
            >
              {data.groups.map((group, gIdx) => {
                const startIdx = rowCount;
                rowCount += group.items.length;
                return (
                  <PackGroup
                    key={group.packName}
                    group={group}
                    checked={checked}
                    focusKey={focusKey}
                    onCheck={handleCheck}
                    startIndex={startIdx}
                  />
                );
              })}
            </motion.div>
          )}

          {/* Keyboard hints */}
          {isPickingMode && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3, ease }}
              className="mt-6 pt-4 border-t border-border/40 text-xs text-muted font-mono"
            >
              [space] check · [j/k] move · [esc] exit
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
