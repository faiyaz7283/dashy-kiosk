import { useState, useEffect } from 'react'
import { formatTime } from '@/shared/date'

export function Clock() {
  const [time, setTime] = useState(Temporal.Now.plainTimeISO())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(Temporal.Now.plainTimeISO())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timeStr = formatTime(time)

  return <span style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{timeStr}</span>
}
