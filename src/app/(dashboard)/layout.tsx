import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SidebarLayout from '@/components/shared/SidebarLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = {
    username: session.username,
    fullName: session.fullName,
    avatarUrl: session.avatarUrl,
  };

  return <SidebarLayout user={user}>{children}</SidebarLayout>;
}
