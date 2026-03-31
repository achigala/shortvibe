export default function RevenueLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-36 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 rounded bg-gray-200 w-1/3" />
              <div className="h-3 rounded bg-gray-100 w-1/4" />
            </div>
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
