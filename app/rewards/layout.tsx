import DashboardLayout from "../dashboard/layout"

export default function RewardsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
