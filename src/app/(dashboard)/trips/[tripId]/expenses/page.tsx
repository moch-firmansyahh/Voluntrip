import { getTripExpensesData } from '@/lib/data/expenses';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExpensesClient from './_components/ExpensesClient';

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
  const data = await getTripExpensesData(tripId);

  if (!data) {
    redirect('/trips');
  }

  return <ExpensesClient initialData={data} />;
}
