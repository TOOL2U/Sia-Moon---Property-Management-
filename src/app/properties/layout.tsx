import AdminSidebarLayout from '@/components/layout/AdminSidebarLayout'

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
