import React, { createContext, useContext, useState, useEffect } from 'react'

interface MarketData {
  price: number
  change: number
  changePercent: number
  timestamp: Date
}

interface MarketDataContextType {
  data: MarketData[]
  loading: boolean
  error: string | null
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined)

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching market data
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate mock data
        const mockData: MarketData[] = Array.from({ length: 10 }, (_, i) => ({
          price: 45000 + Math.random() * 2000,
          change: (Math.random() - 0.5) * 1000,
          changePercent: (Math.random() - 0.5) * 5,
          timestamp: new Date(Date.now() - i * 60000)
        }))
        
        setData(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Set up interval for real-time updates
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <MarketDataContext.Provider value={{ data, loading, error }}>
      {children}
    </MarketDataContext.Provider>
  )
}

export function useMarketData() {
  const context = useContext(MarketDataContext)
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider')
  }
  return context
}
