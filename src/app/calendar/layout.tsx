import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
