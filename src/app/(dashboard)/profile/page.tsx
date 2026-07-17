'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Map, 
  DollarSign, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const router = useRouter();

  // User details states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  
  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Stats states
  const [stats, setStats] = useState({ tripsCreated: 0, expensesCreated: 0 });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session data from cookie-check or page load
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch('/api/profile');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // We can fetch user identity details from a quick dashboard state or API.
        // Let's create an endpoint or just read what's in local session.
        // Actually, we can fetch the user details from the session itself by making an endpoint, or just fetching trips
        // But since we can fetch profile details, let's look: the profile route PUT logic fetches the current user!
        // Let's create a GET request in API to return user details as well!
        // Wait, did we return user details in GET /api/profile?
        // Let's edit GET /api/profile to also return the current session's username and fullName!
        // That is very clean. Let's do that in a bit, but for now we can call GET /api/profile and assume it returns that.
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setFullName(profileData.fullName || '');
          setUsername(profileData.username || '');
          setStats({
            tripsCreated: profileData.tripsCreated || 0,
            expensesCreated: profileData.expensesCreated || 0
          });
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }

      setSuccessMsg('Profil berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh router so that the layout updates headers/sidebars with the new session
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)]">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat profil Anda...</p>
      </div>
    );
  }

  // Get initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.22_0.01_40)] tracking-tight">
          Pengaturan Profil
        </h2>
        <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Kelola informasi pribadi dan keamanan kata sandi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Info & Stats */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden text-center p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[oklch(0.68_0.14_32)] to-orange-400 flex items-center justify-center text-white font-heading font-extrabold text-2xl shadow-lg shadow-rose-100">
                {getInitials(fullName)}
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-[oklch(0.22_0.01_40)]">
                  {fullName}
                </h3>
                <p className="text-xs text-[oklch(0.48_0.01_40)]">@{username}</p>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-4 flex flex-col items-center justify-center text-center">
              <Map className="text-[oklch(0.68_0.14_32)] mb-2" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Total Trips</span>
              <span className="font-heading font-extrabold text-lg mt-1">{stats.tripsCreated}</span>
            </Card>
            <Card className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-4 flex flex-col items-center justify-center text-center">
              <DollarSign className="text-teal-600 mb-2" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Expenses</span>
              <span className="font-heading font-extrabold text-lg mt-1">{stats.expensesCreated}</span>
            </Card>
          </div>
        </div>

        {/* Profile Editing Form */}
        <div className="md:col-span-2">
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6">
            <CardHeader className="p-0 pb-6 border-b border-[oklch(0.90_0.008_70)]/60">
              <CardTitle className="font-heading text-lg font-bold">Informasi Akun</CardTitle>
              <CardDescription className="text-xs text-[oklch(0.48_0.01_40)]">
                Perbarui nama dan rincian login Anda di bawah ini.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-2xl animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">Nama Lengkap</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                        <User size={15} />
                      </span>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[oklch(0.48_0.01_40)] font-bold">@</span>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-8 rounded-xl border-[oklch(0.90_0.008_70)] text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[oklch(0.90_0.008_70)]/60 space-y-4">
                  <h4 className="font-heading text-sm font-bold text-[oklch(0.22_0.01_40)]">Ubah Password (Opsional)</h4>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="oldPassword" className="text-xs font-semibold">Password Lama</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                        <Lock size={15} />
                      </span>
                      <Input
                        id="oldPassword"
                        type="password"
                        placeholder="••••••"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs font-semibold">Password Baru</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                          <Lock size={15} />
                        </span>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold">Konfirmasi Password Baru</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                          <Lock size={15} />
                        </span>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Ulangi password baru"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saveLoading}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5 px-4 h-10 shadow-sm"
                  >
                    {saveLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
