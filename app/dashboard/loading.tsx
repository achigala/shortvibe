export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Highlight cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
      {/* Section title */}
      <div className="h-6 w-40 rounded-lg bg-gray-200" />
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 rounded bg-gray-200 w-3/4" />
                <div className="h-3 rounded bg-gray-100 w-1/2" />
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-200" />
            <div className="h-3 rounded bg-gray-100 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
