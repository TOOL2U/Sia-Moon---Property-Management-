import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
