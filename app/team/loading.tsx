export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-24 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-3 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 rounded bg-gray-200 w-3/4" />
                <div className="h-3 rounded bg-gray-100 w-1/2" />
              </div>
            </div>
            <div className="h-3 rounded bg-gray-100 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
