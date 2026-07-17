'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_70)] flex flex-col items-center justify-center p-4">
      {/* Brand Icon/Name */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-[oklch(0.64_0.22_30)] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-100">
          V
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-[oklch(0.22_0.01_40)] tracking-tight">
            Voluntrip
          </h1>
          <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Plan your journey, share the fun</p>
        </div>
      </div>

      {/* Card Form */}
      <Card className="w-full max-w-md border-[oklch(0.90_0.008_70)] shadow-xl shadow-orange-50/40 bg-white rounded-3xl overflow-hidden">
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
                  className="pl-10 h-11 rounded-xl border-[oklch(0.90_0.008_70)] focus-visible:ring-[oklch(0.64_0.22_30)] focus-visible:border-[oklch(0.64_0.22_30)] text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                Password
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Lock size={16} />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-[oklch(0.90_0.008_70)] focus-visible:ring-[oklch(0.64_0.22_30)] focus-visible:border-[oklch(0.64_0.22_30)] text-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-4 pb-8 flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[oklch(0.64_0.22_30)] text-white hover:bg-[oklch(0.64_0.22_30)]/90 font-medium text-sm transition-all shadow-md shadow-orange-100"
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
              Hubungi developer untuk pembuatan akun baru.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
