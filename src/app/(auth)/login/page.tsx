'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Lock, User, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Koneksi gagal. Pastikan database server aktif.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotUsername || !forgotEmail || !newPassword || !confirmPassword) {
      setForgotError('Tolong isi semua kolom');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password baru minimal 6 karakter');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          email: forgotEmail,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset password');
      }

      setForgotSuccess('Password berhasil diubah! Silakan masuk menggunakan password baru Anda.');
      
      // Reset inputs
      setForgotUsername('');
      setForgotEmail('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Automatically close modal after 3 seconds
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotSuccess(null);
      }, 3000);

    } catch (err: any) {
      setForgotError(err.message || 'Terjadi kesalahan');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-center p-4">
      {/* Brand Icon/Name */}
      <div className="flex flex-col items-center gap-2 mb-8 animate-fade-in">
        <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-16 w-auto object-contain" />
        <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Plan your journey, share the fun</p>
      </div>

      {/* Card Form */}
      <Card className="w-full max-w-md border-[oklch(0.90_0.008_70)] shadow-xl shadow-rose-50/40 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="space-y-2 pt-8 pb-6 px-8 bg-gradient-to-br from-orange-50/50 to-transparent">
          <CardTitle className="text-2xl font-bold font-heading text-[oklch(0.22_0.01_40)]">Welcome Back</CardTitle>
          <CardDescription className="text-sm text-[oklch(0.48_0.01_40)]">
            Silakan masuk untuk mengelola rencana perjalanan Anda
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8 pb-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                Username
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <User size={16} />
                </span>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-[oklch(0.90_0.008_70)] focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)] text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setForgotSuccess(null);
                    setIsForgotOpen(true);
                  }}
                  className="text-xs text-[oklch(0.70_0.08_40)] hover:underline font-bold transition-all focus:outline-none cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Lock size={16} />
                </span>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-[oklch(0.90_0.008_70)] focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)] text-sm transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] focus:outline-none cursor-pointer"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-4 pb-8 flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 font-medium text-sm transition-all shadow-md shadow-rose-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
            
            <p className="text-xs text-[oklch(0.48_0.01_40)] text-center">
              Belum memiliki akun?{' '}
              <a href="/register" className="text-[oklch(0.70_0.08_40)] hover:underline font-bold cursor-pointer">
                Daftar Sekarang
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Forgot Password Dialog Modal */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="max-w-md bg-white border-[oklch(0.90_0.008_70)] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-[oklch(0.22_0.01_40)]">
              Reset Password Akun
            </DialogTitle>
            <DialogDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Masukkan username dan email terdaftar untuk mengatur ulang password Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            {forgotError && (
              <div className="flex items-center gap-3 p-3 text-xs text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="flex items-center gap-3 p-3 text-xs text-teal-700 bg-teal-50 rounded-2xl border border-teal-100">
                <AlertCircle size={15} className="shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="forgotUsername" className="text-xs font-semibold">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <User size={14} />
                </span>
                <Input
                  id="forgotUsername"
                  placeholder="Masukkan username"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                  disabled={forgotLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="forgotEmail" className="text-xs font-semibold">Email / Gmail Terdaftar</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Mail size={14} />
                </span>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                  disabled={forgotLoading}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold">Password Baru</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Lock size={14} />
                </span>
                <Input
                  id="newPassword"
                  type={showForgotPass ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                  disabled={forgotLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPass(!showForgotPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] cursor-pointer focus:outline-none"
                  disabled={forgotLoading}
                >
                  {showForgotPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold">Konfirmasi Password Baru</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Lock size={14} />
                </span>
                <Input
                  id="confirmPassword"
                  type={showForgotPass ? 'text' : 'password'}
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs"
                  required
                  disabled={forgotLoading}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsForgotOpen(false)} 
                className="rounded-xl text-xs"
                disabled={forgotLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={forgotLoading}
                className="rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 text-xs font-bold shadow"
              >
                {forgotLoading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
