import { getTripsByUserId } from '@/lib/data/trips';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TripsListClient from './_components/TripsListClient';

export const revalidate = 0; // Disable static cache for live data updates

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Fetch all trips for the logged in user
  const trips = await getTripsByUserId(session.userId);

  return <TripsListClient initialTrips={trips} />;
}
