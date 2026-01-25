import { useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@public/components/ui/card'
import { Badge } from '@public/components/ui/badge'
import { Button } from '@public/components/ui/button'
import { Separator } from '@public/components/ui/separator'

export function InstanceDetailsPage() {
  const { id } = useParams({ from: '/strategy-instance/$id' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategy Instance</h1>
          <p className="text-muted-foreground">
            Details and performance metrics for strategy #{id}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit</Button>
          <Button>Activate</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Strategy Type</p>
                <p className="text-sm text-muted-foreground">Momentum Trading</p>
              </div>
              <div>
                <p className="text-sm font-medium">Risk Level</p>
                <Badge variant="default">Medium</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Timeframe</p>
                <p className="text-sm text-muted-foreground">4h</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">2023-11-15</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Parameters</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>RSI Period</span>
                  <span>14</span>
                </div>
                <div className="flex justify-between">
                  <span>Stop Loss</span>
                  <span>2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Take Profit</span>
                  <span>5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Position Size</span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Return</p>
                <p className="text-2xl font-bold text-green-600">+24.5%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold">68.3%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Trades</p>
                <p className="text-2xl font-bold">142</p>
              </div>
              <div>
                <p className="text-sm font-medium">Profit Factor</p>
                <p className="text-2xl font-bold">1.84</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Monthly Performance</p>
              <div className="space-y-2 text-sm">
                {[
                  { month: 'Nov', return: '+5.2%' },
                  { month: 'Oct', return: '+3.8%' },
                  { month: 'Sep', return: '+7.1%' },
                  { month: 'Aug', return: '+2.4%' },
                  { month: 'Jul', return: '+4.6%' },
                  { month: 'Jun', return: '+1.4%' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.month}</span>
                    <span className={item.return.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {item.return}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'Trade', symbol: 'BTC/USD', action: 'Buy', price: '$45,231', time: '2 hours ago', status: 'success' },
              { type: 'Signal', symbol: 'ETH/USD', action: 'Sell', price: '$2,456', time: '5 hours ago', status: 'pending' },
              { type: 'Trade', symbol: 'BTC/USD', action: 'Sell', price: '$46,123', time: '1 day ago', status: 'success' },
              { type: 'Alert', symbol: 'LTC/USD', action: 'Price Target', price: '$78.45', time: '2 days ago', status: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'pending' ? 'secondary' : 'outline'}>
                    {activity.type}
                  </Badge>
                  <div>
                    <p className="font-medium">{activity.symbol} - {activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
