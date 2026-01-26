import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@public/components/ui/card'

export function ServicesPage() {
	const services = [
		{
			title: 'Web Development',
			description: 'Custom web applications built with modern technologies like React, TypeScript, and full-stack frameworks.'
		},
		{
			title: 'UI/UX Design',
			description: 'Beautiful and intuitive user interfaces that provide exceptional user experiences.'
		},
		{
			title: 'Consulting',
			description: 'Expert guidance on technology choices, architecture decisions, and best practices.'
		},
		{
			title: 'Performance Optimization',
			description: 'Speed up your applications and optimize databases for maximum efficiency.'
		},
		{
			title: 'Security Audit',
			description: 'Comprehensive security reviews to identify and fix vulnerabilities.'
		},
		{
			title: 'Support & Maintenance',
			description: '24/7 technical support and regular maintenance for your applications.'
		}
	]

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div>
				<h1 className="text-4xl font-bold tracking-tight">
					Our Services
				</h1>
				<p className="text-muted-foreground mt-2">
					Comprehensive solutions to meet all your needs
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				{services.map((service) => (
					<Card key={service.title}>
						<CardHeader>
							<CardTitle className="text-lg">{service.title}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{service.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
