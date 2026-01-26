import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@public/components/ui/card'

export function AboutPage() {
	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div>
				<h1 className="text-4xl font-bold tracking-tight">
					About Us
				</h1>
				<p className="text-muted-foreground mt-2">
					Learn about our mission, values, and team
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Our Mission</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						We're dedicated to creating innovative solutions that help businesses and individuals achieve their goals. Our commitment to excellence, quality, and customer satisfaction drives everything we do.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Core Values</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
						<li>Innovation - Constantly pushing boundaries</li>
						<li>Quality - Excellence in every detail</li>
						<li>Integrity - Honesty and transparency</li>
						<li>Collaboration - Working together for success</li>
						<li>Customer Focus - Your success is our success</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Why Choose Us</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						With years of experience and a talented team, we deliver solutions tailored to your needs. We combine cutting-edge technology with a deep understanding of user experience to create products that truly make a difference.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
