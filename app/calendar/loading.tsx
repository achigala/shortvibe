export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-28 rounded-lg bg-gray-200" />
      <div className="bg-white rounded-2xl p-6 space-y-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
          </div>
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-8 rounded bg-gray-100" />
          ))}
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
