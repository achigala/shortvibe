export default function RewardsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-gray-200" />
          <div className="h-4 w-52 rounded bg-gray-100" />
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-9 rounded-lg bg-gray-200 ${i === 0 ? "w-32" : "w-24"}`} />
        ))}
      </div>
      {/* Reward cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-3 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-6 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-7 h-7 rounded-full bg-gray-200" />
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <div className="h-8 flex-1 rounded-lg bg-gray-200" />
              <div className="h-8 w-8 rounded-lg bg-gray-200" />
              <div className="h-8 w-8 rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
