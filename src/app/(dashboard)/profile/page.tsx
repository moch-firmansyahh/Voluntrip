import { getProfileData } from '@/lib/data/profile';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from './_components/ProfileClient';

export const revalidate = 0; // Disable static cache for live data updates

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const profileData = await getProfileData(session.userId);

  if (!profileData) {
    redirect('/login');
  }

  return <ProfileClient initialProfileData={profileData} />;
}
