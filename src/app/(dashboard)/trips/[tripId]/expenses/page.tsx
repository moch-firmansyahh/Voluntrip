'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  DollarSign, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle,
  PieChart, 
  ListFilter,
  Users,
  Coins,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cell, Pie, PieChart as ReChartsPie, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trip } from '@/types/trip';
import { Expense, ExpenseCategory, ExpenseParticipant } from '@/types/expense';

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateString(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Chart Colors
const COLORS = ['#FF6B4A', '#0D9488', '#EAB308', '#3B82F6', '#A855F7', '#EC4899', '#10B981'];

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('new');
  const [categoryName, setCategoryName] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Split bill states
  const [participantInput, setParticipantInput] = useState('');
  const [tempParticipants, setTempParticipants] = useState<string[]>([]);
  const [participantShares, setParticipantShares] = useState<Record<string, string>>({});
  const [splitEqually, setSplitEqually] = useState(true);

  // Filter state
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (!tripRes.ok) throw new Error('Trip tidak ditemukan');
      const tripData = await tripRes.json();
      setTrip(tripData);

      const expRes = await fetch(`/api/expenses?tripId=${tripId}`);
      if (!expRes.ok) throw new Error('Gagal memuat data pengeluaran');
      const expData = await expRes.json();
      
      setExpenses(expData.expenses || []);
      setCategories(expData.categories || []);
      
      // Default expense date to today (or trip start date if today is outside range)
      const today = new Date().toISOString().split('T')[0];
      setExpenseDate(today);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (tripId) {
      fetchExpenseData();
    }
  }, [tripId]);

  // Recalculate split shares when amount or participants change
  useEffect(() => {
    if (splitEqually && tempParticipants.length > 0 && amount) {
      let amtVal = parseFloat(amount) || 0;
      if (amtVal > 0 && amtVal < 10000) {
        amtVal = amtVal * 1000;
      }
      // Split equally includes the owner + all other participants
      const divisor = tempParticipants.length + 1; 
      const shareVal = (amtVal / divisor).toFixed(2);
      
      const newShares: Record<string, string> = {};
      tempParticipants.forEach(name => {
        newShares[name] = shareVal;
      });
      setParticipantShares(newShares);
    }
  }, [amount, tempParticipants, splitEqually]);

  // Add participant to the list
  const handleAddParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    if (tempParticipants.includes(name)) {
      alert('Nama sudah ada di daftar');
      return;
    }
    setTempParticipants([...tempParticipants, name]);
    setParticipantInput('');
  };

  // Remove participant from list
  const handleRemoveParticipant = (index: number) => {
    const name = tempParticipants[index];
    const newParticipants = tempParticipants.filter((_, i) => i !== index);
    setTempParticipants(newParticipants);
    const newShares = { ...participantShares };
    delete newShares[name];
    setParticipantShares(newShares);
  };

  // Handle share value change manually
  const handleShareChange = (name: string, value: string) => {
    setSplitEqually(false);
    setParticipantShares({
      ...participantShares,
      [name]: value,
    });
  };

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (!categoryId && !categoryName) || !expenseDate) {
      alert('Tolong lengkapi form pengeluaran');
      return;
    }

    let amtVal = parseFloat(amount);
    if (amtVal > 0 && amtVal < 10000) {
      amtVal = amtVal * 1000;
    }

    if (isNaN(amtVal) || amtVal <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }

    // Validate shares sum
    let participantsData = [];
    if (trip?.expense_mode === 'split' && tempParticipants.length > 0) {
      let sumShares = 0;
      for (const name of tempParticipants) {
        const shareAmt = parseFloat(participantShares[name] || '0');
        sumShares += shareAmt;
        participantsData.push({
          participant_name: name,
          share_amount: shareAmt
        });
      }

      if (sumShares > amtVal) {
        alert('Total pembagian tidak boleh melebihi nominal pengeluaran');
        return;
      }
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          amount: amtVal,
          category_id: categoryId === 'new' ? undefined : categoryId,
          categoryName: categoryId === 'new' ? categoryName : undefined,
          note,
          expense_date: expenseDate,
          participants: participantsData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengeluaran');

      setIsAddOpen(false);
      resetForm();
      fetchExpenseData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (expenseId: string) => {
    if (!confirm('Hapus item pengeluaran ini?')) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchExpenseData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategoryId('new');
    setCategoryName('');
    setNote('');
    setTempParticipants([]);
    setParticipantShares({});
    setSplitEqually(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat budget & pengeluaran...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-100 rounded-3xl">
        <AlertCircle size={20} className="shrink-0" />
        <p className="text-sm font-medium">{error || 'Trip tidak ditemukan'}</p>
      </div>
    );
  }

  // Calculate stats
  const totalBudget = parseFloat(trip.budget_total as any);
  const totalSpend = expenses.reduce((sum, item) => sum + parseFloat(item.amount as any), 0);
  const remainingBudget = totalBudget - totalSpend;
  const budgetPercentage = Math.min((totalSpend / totalBudget) * 100, 100);

  // Group by category for charts
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(item => {
    const catName = item.category_name || 'Lainnya';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(item.amount as any);
  });

  const chartData = Object.keys(categoryTotals).map(name => ({
    name,
    value: categoryTotals[name]
  }));

  // Group split balances
  // We sum up the total share amounts for each unique participant
  const splitBalances: Record<string, number> = {};
  expenses.forEach(item => {
    if (item.participants) {
      item.participants.forEach(p => {
        splitBalances[p.participant_name] = (splitBalances[p.participant_name] || 0) + parseFloat(p.share_amount as any);
      });
    }
  });

  // Filter expenses list
  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(item => item.category_id === filterCategory);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href={`/trips/${tripId}`} className="flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.64_0.22_30)] transition-colors">
            <ArrowLeft size={14} /> Back to Overview
          </Link>
          <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
            Budget & Pengeluaran
          </h2>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Kelola anggaran dan catat pengeluaran liburan Anda</p>
        </div>
        
        <Button 
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="rounded-xl bg-[oklch(0.64_0.22_30)] text-white hover:bg-[oklch(0.64_0.22_30)]/90 gap-1.5 shadow-md shadow-orange-100 self-start sm:self-auto"
        >
          <Plus size={18} />
          Catat Pengeluaran
        </Button>
      </div>

      {/* Budget progress bar */}
      <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Progres Anggaran</span>
          <span className="text-xs font-bold text-[oklch(0.22_0.01_40)]">
            {formatIDR(totalSpend)} / {formatIDR(totalBudget)} ({budgetPercentage.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full h-3.5 bg-[oklch(0.94_0.008_70)] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercentage > 90 ? 'bg-red-500' : budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-[oklch(0.64_0.22_30)]'
            }`} 
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[oklch(0.48_0.01_40)] font-medium">
            Terpakai: {formatIDR(totalSpend)}
          </span>
          <span className={`font-semibold ${remainingBudget < 0 ? 'text-red-600' : 'text-teal-600'}`}>
            {remainingBudget < 0 ? `Over budget: ${formatIDR(Math.abs(remainingBudget))}` : `Sisa: ${formatIDR(remainingBudget)}`}
          </span>
        </div>
      </Card>

      {/* Main sections layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Charts and Splits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart Card */}
            <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 flex flex-col justify-between h-80">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 pb-2">
                <PieChart size={18} className="text-[oklch(0.64_0.22_30)]" /> Kategori Pengeluaran
              </CardTitle>
              {chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-[oklch(0.48_0.01_40)]">
                  Belum ada data pengeluaran dicatat
                </div>
              ) : mounted ? (
                <div className="flex-1 min-h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPie>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatIDR(value as number)} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </ReChartsPie>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </Card>

            {/* Split bill summaries card */}
            {trip.expense_mode === 'split' && (
              <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 flex flex-col h-80 overflow-hidden">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 pb-2 shrink-0">
                  <Users size={18} className="text-[oklch(0.58_0.16_185)]" /> Ringkasan Split Bill
                </CardTitle>
                <p className="text-[10px] text-[oklch(0.48_0.01_40)] pb-4 shrink-0">
                  Tagihan yang harus dibayarkan peserta kepada pembuat trip.
                </p>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {Object.keys(splitBalances).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[oklch(0.48_0.01_40)]">
                      Belum ada peserta split bill
                    </div>
                  ) : (
                    Object.keys(splitBalances).map((name) => (
                      <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.98_0.006_70)] border border-[oklch(0.90_0.008_70)]">
                        <span className="font-semibold text-xs text-[oklch(0.22_0.01_40)]">{name}</span>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-[oklch(0.48_0.01_40)] block">
                            Hutang ke Anda
                          </span>
                          <span className="font-extrabold text-xs text-[oklch(0.58_0.16_185)]">
                            {formatIDR(splitBalances[name])}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Expenses lists card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Daftar Pengeluaran</h3>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[oklch(0.48_0.01_40)] font-medium flex items-center gap-1">
                  <ListFilter size={14} /> Filter:
                </span>
                <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || 'all')}>
                  <SelectTrigger className="rounded-xl border-[oklch(0.90_0.008_70)] text-[11px] h-8 bg-white py-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-xs">
                    <SelectItem value="all">Semua</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[oklch(0.90_0.008_70)] p-8 text-center text-xs text-[oklch(0.48_0.01_40)]">
                  Belum ada pengeluaran yang sesuai filter
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <Card key={expense.id} className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-[oklch(0.22_0.01_40)]">
                            {formatIDR(expense.amount)}
                          </span>
                          <span className="bg-orange-50 text-[oklch(0.64_0.22_30)] font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {expense.category_name || 'Lainnya'}
                          </span>
                        </div>
                        {expense.note && (
                          <p className="text-xs text-[oklch(0.22_0.01_40)] font-medium">{expense.note}</p>
                        )}
                        <p className="text-[10px] text-[oklch(0.48_0.01_40)]">
                          Tanggal: {formatDateString(expense.expense_date)}
                        </p>

                        {/* Participants splits info */}
                        {expense.participants && expense.participants.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[oklch(0.90_0.008_70)] mt-1.5">
                            <span className="text-[9px] text-[oklch(0.48_0.01_40)] font-bold uppercase tracking-wider">
                              Splits:
                            </span>
                            {expense.participants.map(p => (
                              <span key={p.id} className="text-[9px] bg-teal-50 text-[oklch(0.58_0.16_185)] font-semibold px-2 py-0.5 rounded-md">
                                {p.participant_name} ({formatIDR(p.share_amount)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0 self-end sm:self-auto"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Trip Budget Helper Widget */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-heading">Budget Advisor</h3>
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[oklch(0.64_0.22_30)] shrink-0">
                <Coins size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Status Anggaran</h4>
                <p className="text-[10px] text-[oklch(0.48_0.01_40)]">Rekomendasi pengeluaran</p>
              </div>
            </div>

            <p className="text-xs text-[oklch(0.48_0.01_40)] leading-relaxed">
              {budgetPercentage >= 100 ? (
                <span className="text-red-600 font-semibold block">⚠️ Anda telah melebihi budget! Kurangi pengeluaran non-prioritas.</span>
              ) : budgetPercentage > 85 ? (
                <span className="text-yellow-600 font-semibold block">⚠️ Anggaran hampir habis. Harap catat dengan hati-hati.</span>
              ) : (
                <span className="text-teal-600 font-semibold block">✓ Anggaran aman. Rencana pengeluaran berjalan dengan baik.</span>
              )}
            </p>
            <hr className="border-[oklch(0.90_0.008_70)]" />
            <div className="space-y-1.5 text-xs text-[oklch(0.48_0.01_40)] font-medium">
              <div className="flex justify-between">
                <span>Mode Budget:</span>
                <span className="font-bold text-[oklch(0.22_0.01_40)] uppercase">{trip.expense_mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Rata-rata Harian:</span>
                <span className="font-bold text-[oklch(0.22_0.01_40)]">
                  {expenses.length > 0 ? formatIDR(totalSpend / expenses.length) : formatIDR(0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ADD EXPENSE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Catat Pengeluaran Baru</DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Masukkan nominal, kategori, tanggal, catatan, dan bagikan tagihan jika perlu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold">Nominal Pengeluaran (IDR)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="Contoh: 200 (untuk 200rb) atau 2000 (untuk 2jt)" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)]"
                  required
                />
                {amount && parseFloat(amount) > 0 && parseFloat(amount) < 10000 && (
                  <p className="text-[10px] text-teal-600 font-bold mt-1">
                    ✓ Otomatis menjadi: {formatIDR(parseFloat(amount) * 1000)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-semibold">Tanggal</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={expenseDate} 
                  onChange={(e) => setExpenseDate(e.target.value)} 
                  className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat" className="text-xs font-semibold">Kategori</Label>
                <Select value={categoryId} onValueChange={(val) => setCategoryId(val || 'new')}>
                  <SelectTrigger className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-xs">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="new">+ Kategori Baru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {categoryId === 'new' && (
                <div className="space-y-1.5">
                  <Label htmlFor="catName" className="text-xs font-semibold">Nama Kategori Baru</Label>
                  <Input 
                    id="catName" 
                    placeholder="Makan Siang / Struk Tol" 
                    value={categoryName} 
                    onChange={(e) => setCategoryName(e.target.value)} 
                    className="rounded-xl border-[oklch(0.90_0.008_70)]"
                    required={categoryId === 'new'}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold">Catatan / Deskripsi (Opsional)</Label>
              <Input 
                id="note" 
                placeholder="Beli oleh-oleh di toko Krisna" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                className="rounded-xl border-[oklch(0.90_0.008_70)]"
              />
            </div>

            {/* Split bill configuration panel */}
            {trip.expense_mode === 'split' && (
              <div className="border border-[oklch(0.90_0.008_70)] p-4 rounded-2xl bg-[oklch(0.98_0.006_70)]/80 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[oklch(0.22_0.01_40)] flex items-center gap-1.5">
                    <Users size={16} /> Split Tagihan Dengan Teman
                  </Label>
                  {tempParticipants.length > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setSplitEqually(!splitEqually)}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-bold ${
                        splitEqually 
                          ? 'bg-teal-50 text-[oklch(0.58_0.16_185)]' 
                          : 'bg-orange-50 text-[oklch(0.64_0.22_30)]'
                      }`}
                    >
                      {splitEqually ? 'Bagi Rata' : 'Bagi Custom'}
                    </Button>
                  )}
                </div>

                {/* Add participant text input */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nama teman (contoh: Alice)" 
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    className="rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-9 bg-white"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddParticipant}
                    className="rounded-xl bg-[oklch(0.58_0.16_185)] text-white hover:bg-[oklch(0.58_0.16_185)]/90 text-xs h-9"
                  >
                    Tambah
                  </Button>
                </div>

                {/* List of participants with custom share input */}
                {tempParticipants.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pt-2">
                    {tempParticipants.map((name, i) => (
                      <div key={name} className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-[oklch(0.90_0.008_70)]">
                        <span className="text-xs font-semibold pl-2">{name}</span>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            placeholder="Share amount" 
                            value={participantShares[name] || ''}
                            onChange={(e) => handleShareChange(name, e.target.value)}
                            disabled={splitEqually}
                            className="w-28 text-right rounded-lg h-8 text-xs border-[oklch(0.90_0.008_70)]"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => handleRemoveParticipant(i)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Sum of shares status */}
                    <div className="text-[10px] text-right font-medium text-[oklch(0.48_0.01_40)] pr-2">
                      Total split: {formatIDR(
                        Object.values(participantShares).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-[oklch(0.48_0.01_40)] text-center py-2">
                    Belum ada teman ditambahkan. Isi nama untuk memulai membagi tagihan.
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl text-xs">
                Batal
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-[oklch(0.64_0.22_30)] text-white hover:bg-[oklch(0.64_0.22_30)]/90 text-xs">
                {formLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
