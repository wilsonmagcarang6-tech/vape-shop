"use client"

import { useEffect, useState } from "react"

export function Clock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return (
      <span className="font-mono text-sm tabular-nums text-muted-foreground px-2 select-none">
        --:--:--
      </span>
    )
  }

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground px-2 select-none">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  )
}
