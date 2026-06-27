import React from 'react';
import { DashboardWidget } from '../types';
import { Settings2, ArrowUp, ArrowDown, Eye, EyeOff, LayoutGrid } from 'lucide-react';

interface DashboardCustomizerProps {
  widgets: DashboardWidget[];
  onToggleWidget: (id: string) => void;
  onMoveWidget: (id: string, direction: 'up' | 'down') => void;
}

export default function DashboardCustomizer({
  widgets,
  onToggleWidget,
  onMoveWidget,
}: DashboardCustomizerProps) {
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <LayoutGrid className="w-4.5 h-4.5 text-indigo-400" />
          Customize Cockpit Layout
        </h3>
        <p className="text-xs text-slate-400 mt-1">Toggle visibility and click arrows to rearrange your dashboard panels</p>
      </div>

      <div className="space-y-2.5">
        {sortedWidgets.map((widget, index) => (
          <div
            key={widget.id}
            className={`p-3 bg-slate-950/30 border rounded-xl flex items-center justify-between gap-4 transition-all ${
              widget.visible ? 'border-slate-800' : 'border-slate-900 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleWidget(widget.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  widget.visible
                    ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                    : 'bg-slate-800 text-slate-600 hover:text-slate-400'
                }`}
                title={widget.visible ? 'Hide panel' : 'Show panel'}
              >
                {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <div>
                <span className="text-xs font-bold text-slate-200">{widget.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onMoveWidget(widget.id, 'up')}
                disabled={index === 0}
                className="p-1.5 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Move panel up"
              >
                <ArrowUp className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => onMoveWidget(widget.id, 'down')}
                disabled={index === widgets.length - 1}
                className="p-1.5 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Move panel down"
              >
                <ArrowDown className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
