import React, { useState } from 'react';
import { Target, X, Check } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  currentSales: number;
  onSaveGoal: (goal: number) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  currentSales,
  onSaveGoal,
}) => {
  const [goalInput, setGoalInput] = useState<string>(String(currentGoal));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      onSaveGoal(val);
      onClose();
    }
  };

  const presets = [
    { label: '₹5 Lakh', value: 500000 },
    { label: '₹10 Lakh', value: 1000000 },
    { label: '₹25 Lakh', value: 2500000 },
    { label: '₹50 Lakh', value: 5000000 },
    { label: '₹60 Lakh', value: 6000000 },
    { label: '₹75 Lakh', value: 7500000 },
    { label: '₹1 Crore', value: 10000000 },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#2D2A26]/60 backdrop-blur-xs p-4 flex items-start sm:items-center justify-center min-h-screen py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] max-w-md w-full p-7 shadow-2xl border border-[#EBE5D9] relative animate-in fade-in zoom-in-95 duration-200 my-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF0E6] text-[#AF8260] flex items-center justify-center border border-[#E8D2C2]">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#2D2A26] tracking-tight">
              Set Sales Revenue Goal
            </h3>
            <p className="text-xs text-[#8C8376] font-medium">
              Define the team's revenue quota for this period
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8C8376] uppercase tracking-wider mb-1.5">
              Sales Target (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#8C8376]">
                ₹
              </span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F9F7F2] border border-[#EBE5D9] rounded-xl text-base font-extrabold text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#5F7161] focus:bg-white"
                placeholder="500000"
                required
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-bold text-[#8C8376] uppercase tracking-wider mb-2">
              Quick Quotas:
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setGoalInput(String(p.value))}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    Number(goalInput) === p.value
                      ? 'bg-[#5F7161] text-white border-[#4A594C]'
                      : 'bg-[#F9F7F2] text-[#433E37] border-[#EBE5D9] hover:bg-[#F1EDE5]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Preview */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EBE5D9] text-xs">
            <div className="flex justify-between font-bold text-[#2D2A26] mb-1">
              <span>Current Achievement:</span>
              <span className="text-[#5F7161]">
                {goalInput && Number(goalInput) > 0
                  ? `${((currentSales / Number(goalInput)) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full h-2 bg-[#EBE5D9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#AF8260] rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    goalInput && Number(goalInput) > 0
                      ? (currentSales / Number(goalInput)) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#8C8376] hover:text-[#2D2A26] hover:bg-[#F1EDE5] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold text-white bg-[#5F7161] hover:bg-[#4E5E50] rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Quota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
