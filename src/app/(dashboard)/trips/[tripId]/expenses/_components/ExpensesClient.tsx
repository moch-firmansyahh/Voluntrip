'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit2, 
  Tag, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  Layers,
  ExternalLink,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpensesPageData, UnifiedExpenseItem } from '@/lib/data/expenses';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateString(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function parseBudgetShorthand(value: string): number {
  const num = parseFloat(value) || 0;
  if (num > 0 && num < 10000) {
    return num * 1000;
  }
  return num;
}

interface ExpensesClientProps {
  initialData: ExpensesPageData;
}

export default function ExpensesClient({ initialData }: ExpensesClientProps) {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [data, setData] = useState<ExpensesPageData>(initialData);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'itinerary' | 'manual'>('all');

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedExpenseItem | null>(null);

  // Custom confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  // Form states for manual expense
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('custom');
  const [participants, setParticipants] = useState<{ name: string; share: string }[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  const showConfirm = useCallback((title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirm(() => () => {
      callback();
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  }, []);

  const refreshExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses?tripId=${tripId}`);
      if (!res.ok) throw new Error('Gagal memuat ulang pengeluaran');
      const freshData = await res.json();
      
      // Merge with itinerary expenses
      setData(prev => {
        const itineraryItems = prev.expenses.filter(item => item.source === 'itinerary');
        const manualItems: UnifiedExpenseItem[] = freshData.expenses.map((e: any) => ({
          id: e.id,
          source: 'manual',
          title: e.note || e.category_name || 'Pengeluaran Manual',
          category_name: e.category_name || 'Umum',
          category_id: e.category_id,
          amount: parseFloat(e.amount || 0),
          expense_date: e.expense_date instanceof Date ? e.expense_date.toISOString().split('T')[0] : String(e.expense_date).split('T')[0],
          note: e.note,
          participants: e.participants
        }));

        const merged = [...manualItems, ...itineraryItems].sort((a, b) => {
          return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
        });

        const totalManualSpend = manualItems.reduce((s, i) => s + i.amount, 0);
        const totalSpend = prev.totalItinerarySpend + totalManualSpend;

        return {
          ...prev,
          categories: freshData.categories || prev.categories,
          expenses: merged,
          totalManualSpend,
          totalSpend,
          remainingBudget: prev.totalBudget - totalSpend
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for add
  const openAddModal = () => {
    setEditingItem(null);
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setCategoryName('');
    setSelectedCategoryId('custom');
    setParticipants([]);
    setIsOpen(true);
  };

  // Open modal for edit manual expense
  const openEditModal = (item: UnifiedExpenseItem) => {
    if (item.source !== 'manual') return;
    setEditingItem(item);
    setAmount(item.amount.toString());
    setExpenseDate(item.expense_date);
    setNote(item.note || '');
    setCategoryName(item.category_name || '');
    setSelectedCategoryId(item.category_id || 'custom');
    setParticipants(item.participants?.map(p => ({ name: p.participant_name, share: p.share_amount.toString() })) || []);
    setIsOpen(true);
  };

  // Handle Form Submit (POST / PUT manual expense)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseBudgetShorthand(amount);
    if (parsedAmount <= 0) {
      alert('Jumlah pengeluaran harus lebih dari 0');
      return;
    }

    setFormLoading(true);
    try {
      const url = editingItem ? `/api/expenses/${editingItem.id}` : '/api/expenses';
      const method = editingItem ? 'PUT' : 'POST';

      const payload: any = {
        tripId,
        amount: parsedAmount,
        expense_date: expenseDate,
        note: note || undefined,
        category_id: selectedCategoryId !== 'custom' ? selectedCategoryId : undefined,
        categoryName: selectedCategoryId === 'custom' ? (categoryName || 'Lain-lain') : undefined,
      };

      if (data.trip?.expense_mode === 'split' && participants.length > 0) {
        payload.participants = participants.map(p => ({
          participant_name: p.name,
          share_amount: parseBudgetShorthand(p.share)
        }));
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan pengeluaran');

      setIsOpen(false);
      refreshExpenses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete manual expense
  const handleDelete = (itemId: string) => {
    showConfirm(
      'Hapus Pengeluaran Manual',
      'Apakah Anda yakin ingin menghapus catatan pengeluaran ini?',
      async () => {
        try {
          const res = await fetch(`/api/expenses/${itemId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus pengeluaran');
          refreshExpenses();
        } catch (err: any) {
          alert(err.message);
        }
      }
    );
  };

  // Filtered expenses list
  const filteredExpenses = data.expenses.filter(item => {
    // Source filter
    if (sourceFilter === 'itinerary' && item.source !== 'itinerary') return false;
    if (sourceFilter === 'manual' && item.source !== 'manual') return false;

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchNote = item.note?.toLowerCase().includes(term);
      const matchLocation = item.location?.toLowerCase().includes(term);
      const matchCategory = item.category_name?.toLowerCase().includes(term);
      return matchTitle || matchNote || matchLocation || matchCategory;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.70_0.08_40)] transition-colors">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
          <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Tabel & Rincian Pengeluaran
          </h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)]">
            Transparansi seluruh pengeluaran otomatis dari Itinerary & catatan tambahan
          </p>
        </div>

        <Button 
          onClick={openAddModal}
          className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 gap-1.5 shadow-md shadow-rose-100 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          Catat Pengeluaran Manual
        </Button>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Budget</span>
              <p className="text-lg font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{formatIDR(data.totalBudget)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Total Terpakai</span>
              <p className="text-lg font-extrabold font-heading text-[oklch(0.22_0.01_40)]">{formatIDR(data.totalSpend)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.86_0.05_45)] flex items-center justify-center text-[oklch(0.70_0.08_40)]">
              <TrendingDown size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Agenda Itinerary</span>
              <p className="text-lg font-extrabold font-heading text-teal-600">{formatIDR(data.totalItinerarySpend)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Calendar size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">Sisa Budget</span>
              <p className={`text-lg font-extrabold font-heading ${data.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatIDR(data.remainingBudget)}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data.remainingBudget < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Layers size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] pointer-events-none" />
          <Input 
            placeholder="Cari pengeluaran / lokasi..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-9 bg-slate-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] hover:text-black cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Source Pills Switcher */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-white text-[oklch(0.22_0.01_40)] shadow-sm'
                : 'text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)]'
            }`}
          >
            Semua ({data.expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('itinerary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              sourceFilter === 'itinerary'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[oklch(0.48_0.01_40)] hover:text-teal-700'
            }`}
          >
            <Calendar size={13} />
            Itinerary ({data.expenses.filter(i => i.source === 'itinerary').length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('manual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              sourceFilter === 'manual'
                ? 'bg-[oklch(0.70_0.08_40)] text-white shadow-sm'
                : 'text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.70_0.08_40)]'
            }`}
          >
            <Tag size={13} />
            Manual ({data.expenses.filter(i => i.source === 'manual').length})
          </button>
        </div>
      </div>

      {/* Main Expenses Container */}
      <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-[oklch(0.48_0.01_40)]">
              <div className="flex flex-col items-center gap-2">
                <TrendingDown size={32} className="text-slate-300" />
                <p className="font-semibold text-sm">Tidak ada data pengeluaran terdeteksi</p>
                <p className="text-xs text-slate-400">
                  {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Tambahkan pengeluaran manual atau beri estimasi biaya pada Itinerary.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE COMPACT CARDS VIEW (md:hidden) - Zero horizontal scroll required */}
              <div className="md:hidden divide-y divide-[oklch(0.90_0.008_70)]/60">
                {filteredExpenses.map((item) => (
                  <div key={item.id} className="p-4 space-y-2.5 hover:bg-slate-50/80 transition-colors">
                    {/* Top Row: Category badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      {item.source === 'itinerary' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                          <Calendar size={11} />
                          Itinerary
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                          <Tag size={11} />
                          {item.category_name || 'Manual'}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-500">
                        {formatDateString(item.expense_date)}
                      </span>
                    </div>

                    {/* Middle Row: Title & Amount */}
                    <div className="flex items-start justify-between gap-3 pt-0.5">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[oklch(0.22_0.01_40)] leading-snug">
                          {item.title}
                        </h4>
                        {item.participants && item.participants.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-normal text-amber-600">
                            <Users size={11} />
                            <span>Split bill ({item.participants.length} orang)</span>
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold font-heading text-sm text-[oklch(0.22_0.01_40)] shrink-0">
                        {formatIDR(item.amount)}
                      </span>
                    </div>

                    {/* Bottom Row: Location/Note & Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <div className="text-slate-500 truncate flex-1 pr-2">
                        {item.location ? (
                          <span className="text-teal-700 font-medium">{item.location}</span>
                        ) : item.note ? (
                          <span className="italic">{item.note}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {item.source === 'itinerary' ? (
                          <Link 
                            href={`/trips/${tripId}/rundown`} 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-800 px-2 py-1 rounded-lg bg-teal-50"
                          >
                            Buka Itinerary <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditModal(item)}
                              className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg gap-1"
                            >
                              <Edit2 size={12} /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(item.id)}
                              className="h-7 px-2 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg gap-1"
                            >
                              <Trash2 size={12} /> Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[oklch(0.98_0.006_70)]/80 border-b border-[oklch(0.90_0.008_70)] text-[11px] font-extrabold uppercase tracking-wider text-[oklch(0.40_0.02_40)]">
                      <th className="py-3.5 px-4">Sumber & Kategori</th>
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4">Nama Pengeluaran / Agenda</th>
                      <th className="py-3.5 px-4">Lokasi / Catatan</th>
                      <th className="py-3.5 px-4 text-right">Jumlah (IDR)</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[oklch(0.90_0.008_70)]/60 text-xs">
                    {filteredExpenses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.source === 'itinerary' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                              <Calendar size={11} />
                              Itinerary
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Tag size={11} />
                              {item.category_name || 'Manual'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {formatDateString(item.expense_date)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[oklch(0.22_0.01_40)]">
                          {item.title}
                          {item.participants && item.participants.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-normal text-amber-600 mt-0.5">
                              <Users size={11} />
                              <span>Split bill ({item.participants.length} orang)</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 max-w-[220px] truncate">
                          {item.location ? (
                            <span className="text-teal-700 font-medium">{item.location}</span>
                          ) : item.note ? (
                            <span className="italic">{item.note}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold font-heading text-[oklch(0.22_0.01_40)] whitespace-nowrap">
                          {formatIDR(item.amount)}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.source === 'itinerary' ? (
                            <Link 
                              href={`/trips/${tripId}/rundown`} 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-800 hover:underline px-2 py-1 rounded-lg bg-teal-50/50"
                              title="Atur via Itinerary"
                            >
                              Buka Itinerary <ExternalLink size={11} />
                            </Link>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openEditModal(item)}
                                className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              >
                                <Edit2 size={13} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(item.id)}
                                className="h-7 w-7 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT MANUAL EXPENSE DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              {editingItem ? 'Edit Pengeluaran Manual' : 'Tambah Pengeluaran Manual'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Catat pengeluaran tambahan yang tidak terikat langsung pada agenda itinerary.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount" className="text-xs font-semibold">Jumlah Pengeluaran (IDR)</Label>
              <Input 
                id="exp-amount" 
                type="number" 
                placeholder="Contoh: 150 (untuk 150rb) atau 150000" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
                required
              />
              {amount && parseBudgetShorthand(amount) > 0 && (
                <p className="text-[10px] text-teal-600 font-bold mt-1">
                  ✓ Otomatis menjadi: {formatIDR(parseBudgetShorthand(amount))}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exp-date" className="text-xs font-semibold">Tanggal</Label>
                <Input 
                  id="exp-date" 
                  type="date" 
                  value={expenseDate} 
                  onChange={(e) => setExpenseDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-category" className="text-xs font-semibold">Kategori</Label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={(val) => setSelectedCategoryId(val || 'custom')}
                >
                  <SelectTrigger className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-xs">
                    {data.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="custom">+ Kategori Kustom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCategoryId === 'custom' && (
              <div className="space-y-1.5 animate-fade-in">
                <Label htmlFor="exp-custom-cat" className="text-xs font-semibold">Nama Kategori Kustom</Label>
                <Input 
                  id="exp-custom-cat" 
                  placeholder="Contoh: Tiket Pesawat / Oleh-oleh" 
                  value={categoryName} 
                  onChange={(e) => setCategoryName(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="exp-note" className="text-xs font-semibold">Keterangan / Catatan (Opsional)</Label>
              <Input 
                id="exp-note" 
                placeholder="Contoh: Beli tiket masuk & parkir" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                {editingItem ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border-[oklch(0.90_0.008_70)] max-w-sm p-6 bg-white animate-fade-in">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-base text-[oklch(0.38_0.06_210)]">
              {confirmTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)] pt-2 leading-relaxed">
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl text-xs h-9 border-[oklch(0.90_0.008_70)] px-3"
            >
              Batal
            </Button>
            <Button 
              onClick={() => {
                if (onConfirm) onConfirm();
              }}
              className="rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-medium px-4 shadow-sm"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
