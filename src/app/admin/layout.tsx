import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
