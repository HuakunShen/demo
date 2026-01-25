import { Card, CardContent, CardHeader, CardTitle } from '@public/components/ui/card'
import { Badge } from '@public/components/ui/badge'
import { Button } from '@public/components/ui/button'
import { useMarketData } from '@public/components/market-data-provider'

export function StrategiesPage() {
  const { data, loading, error } = useMarketData()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading strategies...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Strategies</h1>
        <p className="text-muted-foreground">
          Explore and implement various trading strategies for market analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            name: 'Momentum Trading',
            description: 'Identify and follow market trends',
            risk: 'Medium',
            return: '+12.5%',
            status: 'Active'
          },
          {
            name: 'Mean Reversion',
            description: 'Capitalize on price corrections',
            risk: 'High',
            return: '+8.3%',
            status: 'Testing'
          },
          {
            name: 'Arbitrage',
            description: 'Exploit price differences across markets',
            risk: 'Low',
            return: '+5.2%',
            status: 'Active'
          },
          {
            name: 'Breakout',
            description: 'Trade on significant price movements',
            risk: 'Medium',
            return: '+15.7%',
            status: 'Active'
          },
          {
            name: 'Scalping',
            description: 'Quick trades on small price changes',
            risk: 'High',
            return: '+22.1%',
            status: 'Testing'
          },
          {
            name: 'Position Trading',
            description: 'Hold positions for medium-term gains',
            risk: 'Low',
            return: '+7.8%',
            status: 'Active'
          }
        ].map((strategy, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <Badge variant={strategy.status === 'Active' ? 'default' : 'secondary'}>
                  {strategy.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {strategy.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={strategy.risk === 'High' ? 'destructive' : strategy.risk === 'Medium' ? 'default' : 'secondary'}>
                    {strategy.risk}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Avg Return:</span>
                  <span className="text-sm font-bold text-green-600">{strategy.return}</span>
                </div>
              </div>
              <Button className="w-full mt-4">View Strategy</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
