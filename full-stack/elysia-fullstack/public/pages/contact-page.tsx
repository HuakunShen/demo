import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@public/components/ui/card'
import { Input } from '@public/components/ui/input'
import { Button } from '@public/components/ui/button'
import { Label } from '@public/components/ui/label'

export function ContactPage() {
	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div>
				<h1 className="text-4xl font-bold tracking-tight">
					Contact Us
				</h1>
				<p className="text-muted-foreground mt-2">
					Get in touch with our team
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Email</CardTitle>
					</CardHeader>
					<CardContent>
						<a href="mailto:hello@demo.com" className="text-sm text-blue-500 hover:underline">
							hello@demo.com
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Phone</CardTitle>
					</CardHeader>
					<CardContent>
						<a href="tel:+1-800-demo" className="text-sm text-blue-500 hover:underline">
							+1 (800) DEMO-APP
						</a>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Send us a Message</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="Your name"
								type="text"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								placeholder="your@email.com"
								type="email"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="subject">Subject</Label>
							<Input
								id="subject"
								placeholder="How can we help?"
								type="text"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<textarea
								id="message"
								placeholder="Your message..."
								className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								rows={5}
							/>
						</div>

						<Button className="w-full">Send Message</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
