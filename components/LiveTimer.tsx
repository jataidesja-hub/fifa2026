'use client'
import { useState, useEffect } from 'react'

export default function LiveTimer({ initialMinute, status }: { initialMinute: number | null, status: string }) {
  const [minute, setMinute] = useState(initialMinute || 1)

  useEffect(() => {
    // Só roda o ticker se estiver ao vivo
    if (status !== 'IN_PLAY') return

    // Sincroniza com a prop caso mude no banco
    if (initialMinute) setMinute(initialMinute)

    const interval = setInterval(() => {
      setMinute(m => m + 1)
    }, 60000) // 1 minuto real (para mock de tempo)
    
    return () => clearInterval(interval)
  }, [status, initialMinute])

  if (status === 'PAUSED') return <span>Intervalo</span>
  if (status !== 'IN_PLAY') return null

  const half = minute <= 45 ? '1T' : minute <= 90 ? '2T' : 'Pro'
  const displayMin = minute > 45 && minute <= 50 ? '45+' : minute > 90 && minute <= 95 ? '90+' : minute

  return <span>{half} {displayMin}'</span>
}
