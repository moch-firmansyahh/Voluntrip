'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Map, 
  Compass, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Link as LinkIcon,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRESETS = [
  { name: 'Explorer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Hiker', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden' },
  { name: 'Surfer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { name: 'Backpacker', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha' }
];

export default function ProfilePage() {
  const router = useRouter();

  // Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  // User details states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESETS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  
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
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setOriginalData(profileData);
          setFullName(profileData.fullName || '');
          setUsername(profileData.username || '');
          setEmail(profileData.email || '');
          
          // Match avatar url to presets or custom
          const avatar = profileData.avatarUrl || '';
          const matchesPreset = PRESETS.some(p => p.url === avatar);
          if (matchesPreset) {
            setSelectedAvatar(avatar);
            setCustomAvatar('');
          } else if (avatar) {
            setCustomAvatar(avatar);
          } else {
            setSelectedAvatar(PRESETS[0].url);
          }

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

  const handleCancel = () => {
    if (originalData) {
      setFullName(originalData.fullName || '');
      setUsername(originalData.username || '');
      setEmail(originalData.email || '');
      
      const avatar = originalData.avatarUrl || '';
      const matchesPreset = PRESETS.some(p => p.url === avatar);
      if (matchesPreset) {
        setSelectedAvatar(avatar);
        setCustomAvatar('');
      } else if (avatar) {
        setCustomAvatar(avatar);
      } else {
        setSelectedAvatar(PRESETS[0].url);
      }
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

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
      const finalAvatar = customAvatar.trim() || selectedAvatar;
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username,
          email,
          avatarUrl: finalAvatar,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }

      setOriginalData({
        fullName,
        username,
        email,
        avatarUrl: finalAvatar,
        tripsCreated: stats.tripsCreated,
        expensesCreated: stats.expensesCreated
      });

      setSuccessMsg('Profil berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      
      // Refresh router and layout context
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-[oklch(0.48_0.01_40)] animate-pulse">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Memuat profil Anda...</p>
      </div>
    );
  }

  // Final rendering avatar url
  const displayAvatar = customAvatar.trim() || selectedAvatar;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold font-heading text-[oklch(0.38_0.06_210)] tracking-tight">
          Pengaturan Profil
        </h2>
        <p className="text-xs text-[oklch(0.48_0.01_40)] font-medium">Kelola data pribadi, kata sandi, dan foto identitas Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Info & Stats */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white overflow-hidden text-center p-6 flex flex-col items-center">
            <div className="flex flex-col items-center space-y-4">
              {displayAvatar ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[oklch(0.86_0.05_45)] bg-gradient-to-tr from-amber-50 to-orange-100 p-1 shadow-md">
                  <img src={displayAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[oklch(0.70_0.08_40)] to-orange-400 flex items-center justify-center text-white font-heading font-extrabold text-2xl shadow-lg shadow-rose-100">
                  {fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-heading font-extrabold text-base text-[oklch(0.22_0.01_40)]">
                  {fullName}
                </h3>
                <p className="text-xs text-[oklch(0.48_0.01_40)]">@{username}</p>
                {email && <p className="text-[10px] text-[oklch(0.48_0.01_40)] mt-0.5">{email}</p>}
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-4 flex flex-col items-center justify-center text-center">
              <Map className="text-[oklch(0.70_0.08_40)] mb-2" size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Total Trips</span>
              <span className="font-heading font-extrabold text-lg mt-1 text-[oklch(0.22_0.01_40)]">{stats.tripsCreated}</span>
            </Card>
            <Card className="rounded-2xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-4 flex flex-col items-center justify-center text-center">
              <Compass className="text-[oklch(0.38_0.06_210)] mb-2" size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[oklch(0.48_0.01_40)]">Agenda</span>
              <span className="font-heading font-extrabold text-lg mt-1 text-[oklch(0.22_0.01_40)]">{stats.expensesCreated}</span>
            </Card>
          </div>
        </div>

        {/* Profile Editing Form */}
        <div className="md:col-span-2">
          <Card className="rounded-3xl border-[oklch(0.90_0.008_70)] shadow-sm bg-white p-6">
            <CardHeader className="p-0 pb-6 border-b border-[oklch(0.90_0.008_70)]/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg font-bold text-[oklch(0.22_0.01_40)]">Informasi Akun</CardTitle>
                <CardDescription className="text-xs text-[oklch(0.48_0.01_40)]">
                  Perbarui nama, email, foto profil, dan kata sandi Anda.
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-[oklch(0.38_0.06_210)] hover:bg-[oklch(0.38_0.06_210)]/90 text-white font-bold text-xs gap-1.5 h-9 px-3"
                >
                  <Edit2 size={13} />
                  Edit
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0 pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-2xl animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Email, Name, and Username Row */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Email Address</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                        <Mail size={15} />
                      </span>
                      <Input
                        id="email"
                        type="email"
                        disabled={!isEditing}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)] ${!isEditing ? 'bg-[oklch(0.98_0.006_70)] cursor-not-allowed opacity-80' : ''}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Nama Lengkap</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                          <User size={15} />
                        </span>
                        <Input
                          id="fullName"
                          disabled={!isEditing}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)] ${!isEditing ? 'bg-[oklch(0.98_0.006_70)] cursor-not-allowed opacity-80' : ''}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Username</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[oklch(0.48_0.01_40)] font-bold">@</span>
                        <Input
                          id="username"
                          disabled={!isEditing}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`pl-8 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)] ${!isEditing ? 'bg-[oklch(0.98_0.006_70)] cursor-not-allowed opacity-80' : ''}`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <>
                    {/* Avatar Picker Widget */}
                    <div className="space-y-2.5 pt-4 border-t border-[oklch(0.90_0.008_70)]/60">
                      <Label className="text-xs font-bold text-[oklch(0.22_0.01_40)] block">Pilih Foto Profil (Avatar)</Label>
                      <div className="flex gap-4 items-center">
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
                      
                      <div className="space-y-1">
                        <Label htmlFor="custom-avatar" className="text-[10px] text-[oklch(0.48_0.01_40)] font-medium">Atau gunakan URL gambar sendiri:</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.01_40)]">
                            <LinkIcon size={13} />
                          </span>
                          <Input 
                            id="custom-avatar"
                            placeholder="https://example.com/avatar.jpg"
                            value={customAvatar}
                            onChange={(e) => setCustomAvatar(e.target.value)}
                            className="pl-9 h-9 rounded-xl text-xs border-[oklch(0.90_0.008_70)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Fields */}
                    <div className="pt-4 border-t border-[oklch(0.90_0.008_70)]/60 space-y-4">
                      <h4 className="font-heading text-sm font-bold text-[oklch(0.22_0.01_40)]">Ubah Password (Opsional)</h4>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="oldPassword" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Password Lama</Label>
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
                            className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="newPassword" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Password Baru</Label>
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
                              className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[oklch(0.22_0.01_40)]">Konfirmasi Password Baru</Label>
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
                              className="pl-9 rounded-xl border-[oklch(0.90_0.008_70)] text-xs h-10 focus-visible:ring-[oklch(0.70_0.08_40)] focus-visible:border-[oklch(0.70_0.08_40)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[oklch(0.90_0.008_70)]/60">
                  {isEditing ? (
                    <>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saveLoading}
                        className="rounded-xl border-[oklch(0.90_0.008_70)] text-[oklch(0.22_0.01_40)] hover:bg-[oklch(0.94_0.008_70)] font-bold text-xs px-5 h-10 cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saveLoading}
                        className="rounded-xl bg-[oklch(0.70_0.08_40)] hover:bg-[oklch(0.70_0.08_40)]/90 text-white font-bold text-xs gap-1.5 px-5 h-10 shadow cursor-pointer"
                      >
                        {saveLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Simpan Perubahan
                      </Button>
                    </>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl bg-[oklch(0.38_0.06_210)] hover:bg-[oklch(0.38_0.06_210)]/90 text-white font-bold text-xs px-6 h-10 shadow-sm cursor-pointer"
                    >
                      <Edit2 size={13} className="mr-1.5" />
                      Edit Profil
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
