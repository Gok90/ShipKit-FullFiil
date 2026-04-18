'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

// ── Types ──
type PickStatus = 'ok' | 'short' | 'out' | 'unmatched';

interface PickItem {
  color: string;
  colorHex: string | null;
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

// ── Component ──
export default function PickList({ data }: { data: PickListData }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [pickingMode, setPickingMode] = useState(false);

  // Calculate progress
  const pickedQty = useMemo(() => {
    let total = 0;
    data.groups.forEach(group => {
      group.items.forEach(item => {
        if (checked[item.checkKey]) total += item.reqQty;
      });
    });
    return total;
  }, [checked, data]);

  const percentage = Math.round((pickedQty / data.totalToPull) * 100);
  const isDone = percentage === 100;

  // Handlers
  const toggleItem = useCallback((checkKey: string) => {
    setChecked(prev => ({
      ...prev,
      [checkKey]: !prev[checkKey]
    }));
  }, []);

  const toggleAll = useCallback(() => {
    const allChecked = Object.values(checked).every(v => v);
    const newState: Record<string, boolean> = {};
    data.groups.forEach(group => {
      group.items.forEach(item => {
        newState[item.checkKey] = !allChecked;
      });
    });
    setChecked(newState);
  }, [checked, data.groups]);

  return (
    <div className="w-full bg-gradient-to-b from-slate-950 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-950/50 backdrop-blur">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <ChevronDown
            size={16}
            className={`text-cyan-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
          <span className="text-sm font-semibold text-slate-200">Pick List</span>
        </button>

        <div className="flex items-center gap-4 flex-1 ml-6">
          <span className="text-xs text-slate-400">
            {data.totalToPull} items · {data.short} SHORT · {data.out} OUT
          </span>
          <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden max-w-xs">
            <div
              className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-cyan-500'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300 min-w-12 text-right">
            {percentage}%
          </span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={toggleAll}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            {Object.values(checked).some(v => v) ? 'Clear' : 'All'}
          </button>
          <button
            onClick={() => setPickingMode(!pickingMode)}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              pickingMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-cyan-600 text-white hover:bg-cyan-700'
            }`}
          >
            {pickingMode ? '⏹ Exit' : '▶ Pick'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="divide-y divide-slate-700">
          {data.groups.map((group, groupIdx) => {
            const isUnmatched = group.packName === 'UNMATCHED';
            const allCheckedInGroup = group.items.every(item => checked[item.checkKey]);

            return (
              <div key={groupIdx} className="px-4 py-3">
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-bold tracking-wider uppercase ${
                      isUnmatched ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {group.packName}
                  </span>
                  {allCheckedInGroup && group.items.length > 0 && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      done
                    </span>
                  )}
                </div>

                {/* Rows */}
                <div className="space-y-1">
                  {group.items.map((item, itemIdx) => {
                    const isChecked = checked[item.checkKey];
                    const statusClass =
                      item.status === 'short'
                        ? 'bg-amber-950/40 border-amber-700/40 hover:border-amber-600/60'
                        : item.status === 'out'
                        ? 'bg-red-950/40 border-red-700/40 hover:border-red-600/60'
                        : item.status === 'unmatched'
                        ? 'bg-slate-800/40 border-slate-600/40 hover:border-slate-500/60'
                        : 'bg-slate-800/30 border-slate-600/40 hover:border-slate-500/60';

                    const textClass =
                      item.status === 'short'
                        ? 'text-amber-300'
                        : item.status === 'out'
                        ? 'text-red-300'
                        : item.status === 'unmatched'
                        ? 'text-slate-400'
                        : 'text-slate-200';

                    return (
                      <button
                        key={item.checkKey}
                        onClick={() => toggleItem(item.checkKey)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border transition-all text-left ${statusClass} ${
                          isChecked ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-500 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <CheckCircle2 size={14} className="text-white" />}
                        </div>

                        {/* Color Dot */}
                        {item.colorHex ? (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-600"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        ) : (
                          <div className="w-3 h-3 rounded-full flex-shrink-0 bg-slate-600" />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${textClass}`}>
                            {item.color}
                          </div>
                          <div className="text-xs text-slate-500">
                            stock: {item.stock === null ? '—' : item.stock}
                          </div>
                        </div>

                        {/* Badge */}
                        {item.status === 'short' && (
                          <span className="text-xs font-bold text-amber-400 px-2 py-1 bg-amber-950/40 rounded flex-shrink-0">
                            SHORT
                          </span>
                        )}
                        {item.status === 'out' && (
                          <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-950/40 rounded flex-shrink-0">
                            OUT
                          </span>
                        )}
                        {item.status === 'unmatched' && (
                          <span className="text-xs font-bold text-amber-400 px-2 py-1 bg-amber-950/40 rounded flex-shrink-0">
                            NO MATCH
                          </span>
                        )}

                        {/* Quantity */}
                        <div className="text-sm font-bold text-cyan-400 px-2 py-1 bg-cyan-950/40 rounded flex-shrink-0">
                          ×{item.reqQty}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Status */}
      {!collapsed && (
        <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-700 text-xs text-slate-400">
          {isDone ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} />
              All {pickedQty} items picked
            </span>
          ) : (
            <span>
              {pickedQty} of {data.totalToPull} picked
            </span>
          )}
        </div>
      )}
    </div>
  );
}
