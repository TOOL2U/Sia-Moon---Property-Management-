import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
