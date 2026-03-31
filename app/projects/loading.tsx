export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded-lg bg-gray-200" />
        <div className="h-10 w-32 rounded-xl bg-gray-200" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-7 w-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 rounded bg-gray-200 w-3/4" />
                <div className="h-3 rounded bg-gray-100 w-1/2" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-2 rounded-full bg-gray-200" />
            <div className="flex items-center gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-7 h-7 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
