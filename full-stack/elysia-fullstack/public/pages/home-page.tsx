import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@public/components/ui/card'
import { Button } from '@public/components/ui/button'

export function HomePage() {
	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			<div className="text-center space-y-4">
				<h1 className="text-5xl font-bold tracking-tight">
					Welcome to Demo App
				</h1>
				<p className="text-lg text-muted-foreground">
					Explore our comprehensive platform with modern design and great features
				</p>
				<div className="flex gap-4 justify-center pt-4">
					<Button size="lg" asChild>
						<a href="#/about">Learn More</a>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<a href="#/contact">Get in Touch</a>
					</Button>
				</div>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Fast & Reliable</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Built with modern technologies for optimal performance and reliability
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">User Friendly</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Intuitive design that makes it easy to navigate and use all features
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Secure & Safe</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Enterprise-grade security to protect your data and privacy
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
