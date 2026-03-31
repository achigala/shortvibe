"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { AppProgressBar as ProgressBar } from "next-nprogress-bar"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ProgressBar
          height="3px"
          color="var(--sv-purple)"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </QueryClientProvider>
    </SessionProvider>
  )
}
