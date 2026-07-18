import { getTripById } from '@/lib/data/trips';
import { getRundownByTripId } from '@/lib/data/rundown';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import TripOverviewClient from './_components/TripOverviewClient';

export const revalidate = 0; // Disable static cache for live data updates

export default async function Page({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { tripId } = await params;
  if (!tripId) {
    notFound();
  }

  // Fetch trip and rundown parallelly on the server side
  const [trip, days] = await Promise.all([
    getTripById(tripId),
    getRundownByTripId(tripId)
  ]);

  if (!trip) {
    notFound();
  }

  // Verify ownership
  if (trip.user_id !== session.userId) {
    redirect('/trips');
  }

  return <TripOverviewClient initialTrip={trip} initialRundown={days} />;
}
