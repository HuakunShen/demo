import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@public/components/ui/card'

export function AboutPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					About UpDown15
				</h1>
				<p className="text-muted-foreground mt-2">
					Real-time market data visualization and analysis platform
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Platform Overview</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						UpDown15 provides real-time cryptocurrency market data
						with advanced visualization tools. Track price
						movements, analyze trends, and make informed decisions
						with our comprehensive dashboard.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Key Features</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
						<li>Real-time market data streaming</li>
						<li>Interactive charts with technical indicators</li>
						<li>Historical price data analysis</li>
						<li>Market countdown timers</li>
						<li>Responsive design for all devices</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Technology Stack</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Built with React, TypeScript, Elysia server framework,
						and WebSocket connections for real-time data streaming.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
