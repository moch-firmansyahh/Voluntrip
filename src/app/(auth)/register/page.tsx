'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Lock, 
  Mail, 
  FileText,
  Link as LinkIcon,
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const PRESETS = [
  { name: 'Explorer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Hiker', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden' },
  { name: 'Surfer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { name: 'Backpacker', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha' }
];

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESETS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !fullName || !username || !password) {
      setError('Tolong isi semua kolom wajib');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const finalAvatar = customAvatar.trim() || selectedAvatar;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          username,
          password,
          avatarUrl: finalAvatar
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.002_240)] flex flex-col items-center justify-center p-4">
      {/* Brand Logo Header */}
      <div className="flex flex-col items-center gap-2 mb-6 animate-fade-in">
        <img src="/images/Logo_voluntrip.png" alt="Voluntrip Logo" className="h-14 w-auto object-contain" />
        <p className="text-[10px] text-[oklch(0.48_0.01_40)] font-bold uppercase tracking-widest">Registrasi Akun Baru</p>
      </div>

      {/* Registration Form Card */}
      <Card className="w-full max-w-lg border-[oklch(0.90_0.008_70)] shadow-xl shadow-rose-50/40 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1.5 pt-6 pb-4 px-8 bg-gradient-to-br from-orange-50/40 to-transparent">
          <CardTitle className="text-xl font-bold font-heading text-[oklch(0.22_0.01_40)]">Mulai Perjalanan Anda</CardTitle>
          <CardDescription className="text-xs text-[oklch(0.48_0.01_40)]">
            Buat akun Voluntrip untuk merencanakan liburan impian Anda.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8 pb-4">
            {error && (
              <div className="flex items-center gap-3 p-3 text-xs text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                Email / Gmail
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Mail size={15} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                    <FileText size={15} />
                  </span>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nama Lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[oklch(0.48_0.01_40)] font-bold">@</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-8 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                Password
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <Lock size={15} />
                </span>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] focus:outline-none cursor-pointer"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Avatar Selection Picker (Travel character icons) */}
            <div className="space-y-2 pt-2 border-t border-[oklch(0.90_0.008_70)]/50">
              <Label className="text-xs font-bold text-[oklch(0.22_0.01_40)] block">Pilih Foto Profil (Avatar)</Label>
              
              <div className="flex gap-4 items-center py-1">
                {PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.url && !customAvatar;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.url);
                        setCustomAvatar('');
                      }}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 bg-gradient-to-tr from-amber-50 to-orange-100 p-0.5 transition-all cursor-pointer ${
                        isSelected ? 'border-[oklch(0.38_0.06_210)] scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {/* Custom Avatar URL Field */}
              <div className="space-y-1">
                <Label htmlFor="custom-avatar" className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium">Atau gunakan URL gambar sendiri (opsional):</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                    <LinkIcon size={12} />
                  </span>
                  <Input 
                    id="custom-avatar"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    className="pl-8 h-8 rounded-lg text-[10px] border-[oklch(0.90_0.008_70)]"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-2 pb-6 flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 font-bold text-xs shadow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                'Daftar Akun Baru'
              )}
            </Button>
            
            <p className="text-[11px] text-[oklch(0.48_0.01_40)] text-center">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-[oklch(0.70_0.08_40)] hover:underline font-bold">
                Masuk Di Sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
