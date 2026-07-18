'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  FileText,
  Lock,
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESETS[0].url);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !firstName || !lastName || !username || !password) {
      setError('Tolong isi semua kolom');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          username,
          password,
          avatarUrl: selectedAvatar
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      // Redirect immediately to dashboard on success
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
      <Card className="w-full max-w-md border-[oklch(0.90_0.008_70)] shadow-xl shadow-rose-50/40 bg-white rounded-3xl overflow-hidden animate-fade-in relative">
        <CardHeader className="space-y-1.5 pt-6 pb-4 px-8 bg-gradient-to-br from-orange-50/40 to-transparent relative">
          {/* Back button */}
          <a
            href="/login"
            className="absolute left-6 top-6 text-[oklch(0.48_0.01_40)] hover:text-[oklch(0.22_0.01_40)] transition-colors cursor-pointer"
            title="Kembali ke Halaman Login"
          >
            <ArrowLeft size={16} />
          </a>
          
          <div className="pl-6">
            <CardTitle className="text-xl font-bold font-heading text-[oklch(0.22_0.01_40)]">Mulai Perjalanan Anda</CardTitle>
            <CardDescription className="text-xs text-[oklch(0.48_0.01_40)]">
              Buat akun Voluntrip untuk merencanakan liburan impian Anda.
            </CardDescription>
          </div>
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

            <div className="grid grid-cols-2 gap-3">
              {/* First Name Input */}
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                  Nama Depan
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                    <FileText size={15} />
                  </span>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Nama Depan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Last Name Input */}
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                  Nama Belakang
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                    <FileText size={15} />
                  </span>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Nama Belakang"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">
                Username
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                  <User size={15} />
                </span>
                <Input
                  id="username"
                  type="text"
                  placeholder="Pilih username unik"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-[oklch(0.90_0.008_70)] text-xs focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                  required
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
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
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
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-2 pb-6 flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-[oklch(0.70_0.08_40)] text-white hover:bg-[oklch(0.70_0.08_40)]/90 font-bold text-xs shadow-md shadow-rose-100"
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
              <a href="/login" className="text-[oklch(0.70_0.08_40)] hover:underline font-bold cursor-pointer">
                Masuk Di Sini
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
