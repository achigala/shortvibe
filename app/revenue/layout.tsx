import DashboardLayout from "../dashboard/layout"

export default function RevenueLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
