'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface DayPreviewItem {
  id: string;
  day_date: string;
  order_index: number;
  activityCount: number;
}

interface ConfirmDateChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: DayPreviewItem[];
  neededDeletionsCount: number;
  onConfirm: (selectedDayIdsToDelete: string[]) => void;
  onCancel: () => void;
}

function formatDateString(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function ConfirmDateChangeDialog({
  open,
  onOpenChange,
  days,
  neededDeletionsCount,
  onConfirm,
  onCancel,
}: ConfirmDateChangeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
    }
  }, [open]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (prev.length >= neededDeletionsCount) {
          // Replace or prevent if already maxed
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  const isFormValid = selectedIds.length === neededDeletionsCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6 shadow-2xl animate-fade-in">
        <DialogHeader>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
            <AlertTriangle size={20} />
          </div>
          <DialogTitle className="font-heading text-lg font-bold text-[oklch(0.22_0.01_40)]">
            Jumlah Hari Trip Berkurang
          </DialogTitle>
          <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)] leading-relaxed pt-1">
            Durasi trip berkurang {neededDeletionsCount} hari. Silakan pilih <strong className="text-amber-700">{neededDeletionsCount} hari</strong> yang ingin dihapus dari itinerary beserta kegiatannya:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-y-auto my-2 pr-1">
          {days.map((day) => {
            const isSelected = selectedIds.includes(day.id);
            return (
              <label
                key={day.id}
                onClick={() => toggleSelect(day.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-red-500 bg-red-50/60 shadow-sm'
                    : 'border-[oklch(0.90_0.008_70)] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by container click
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-[oklch(0.22_0.01_40)] block">
                      Hari {day.order_index + 1} ({formatDateString(day.day_date)})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {day.activityCount > 0
                        ? `${day.activityCount} agenda kegiatan`
                        : '0 kegiatan (kosong)'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200">
                    <Trash2 size={11} /> Dihapus
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className="rounded-xl text-xs h-9 border-[oklch(0.90_0.008_70)] px-4"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={!isFormValid}
            onClick={() => {
              onConfirm(selectedIds);
              onOpenChange(false);
            }}
            className={`rounded-xl text-xs h-9 px-4 font-semibold ${
              isFormValid
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Lanjutkan & Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
