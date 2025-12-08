import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@public/components/theme-provider'
import Layout from '@public/layouts'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter
} from './components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
	TableCaption
} from './components/ui/table'
import { ButtonGroup, ButtonGroupSeparator } from './components/ui/button-group'
import { Separator } from './components/ui/separator'
import { ChartAreaInteractive } from './components/chart-demo'
import { LightweightChart } from './components/lw-chart'
import { TabsDemo } from './components/tabs'

const chartData = [
	{ month: 'Jan', revenue: 1860, users: 400 },
	{ month: 'Feb', revenue: 3020, users: 300 },
	{ month: 'Mar', revenue: 2370, users: 200 },
	{ month: 'Apr', revenue: 2780, users: 278 },
	{ month: 'May', revenue: 1890, users: 189 },
	{ month: 'Jun', revenue: 2390, users: 239 }
]

const chartConfig = {
	revenue: {
		label: 'Revenue',
		color: 'hsl(var(--chart-1))'
	},
	users: {
		label: 'Users',
		color: 'hsl(var(--chart-2))'
	}
}

const tableData = [
	{
		id: 1,
		name: 'John Doe',
		email: 'john@example.com',
		status: 'Active',
		role: 'Admin'
	},
	{
		id: 2,
		name: 'Jane Smith',
		email: 'jane@example.com',
		status: 'Active',
		role: 'User'
	},
	{
		id: 3,
		name: 'Bob Johnson',
		email: 'bob@example.com',
		status: 'Inactive',
		role: 'User'
	},
	{
		id: 4,
		name: 'Alice Williams',
		email: 'alice@example.com',
		status: 'Active',
		role: 'Moderator'
	}
]

function App() {
	const [count, setCount] = useState(0)
	const increase = () => setCount((c) => c + 1)

	return (
		<ThemeProvider>
			<div className="min-h-screen p-8 space-y-8">
				{/* Hero Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-4 flex-wrap">
						<h1 className="text-4xl font-bold">
							Bun/Elysia Fullstack
						</h1>
						<Badge variant="default">v1.0.50</Badge>
						<Badge variant="secondary">Production</Badge>
						<Badge variant="outline">React 19</Badge>
					</div>
					<p className="text-muted-foreground text-lg">
						Showcasing shadcn/ui components with a modern dashboard
						interface
					</p>
				</div>

				<Separator />

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Total Revenue</CardTitle>
							<CardDescription>Last 30 days</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">$45,231</div>
							<p className="text-sm text-muted-foreground mt-2">
								+20.1% from last month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Active Users</CardTitle>
							<CardDescription>Currently online</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">2,350</div>
							<p className="text-sm text-muted-foreground mt-2">
								+180.1% from last month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Counter Demo</CardTitle>
							<CardDescription>
								Interactive button
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{count}</div>
							<Button onClick={increase} className="mt-4">
								Increase
							</Button>
						</CardContent>
					</Card>
				</div>
				<LightweightChart />
				<TabsDemo />
				<ChartAreaInteractive />
			</div>
		</ThemeProvider>
	)
}

const root = createRoot(document.getElementById('elysia')!)
root.render(
	<Layout className="gap-6">
		<App />
	</Layout>
)
