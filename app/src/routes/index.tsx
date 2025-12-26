import { createFileRoute } from '@tanstack/react-router'
import {
	Zap,
	Server,
	Route as RouteIcon,
	Shield,
	Waves,
	Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'

export const Route = createFileRoute('/')({ component: App })

function App() {
	const features = [
		{
			icon: <Zap className="w-10 h-10 text-emerald-400" />,
			title: 'Instant Uptime Monitoring',
			description:
				'Fast, reliable checks for HTTP, HTTPS, and TCP endpoints from multiple regions.',
		},
		{
			icon: <Server className="w-10 h-10 text-emerald-400" />,
			title: 'Public Status Pages',
			description:
				'Clean, calm status pages that build trust with customers during incidents.',
		},
		{
			icon: <RouteIcon className="w-10 h-10 text-emerald-400" />,
			title: 'Incident Updates',
			description:
				'Post clear incident updates and resolutions without unnecessary complexity.',
		},
		{
			icon: <Shield className="w-10 h-10 text-emerald-400" />,
			title: 'Built for Reliability',
			description:
				'boringstatus is designed to stay online even when your systems are not.',
		},
		{
			icon: <Waves className="w-10 h-10 text-emerald-400" />,
			title: 'Signal Over Noise',
			description:
				'Alerts that fire only when something is actually broken.',
		},
		{
			icon: <Sparkles className="w-10 h-10 text-emerald-400" />,
			title: 'Intentionally Boring',
			description:
				'No flashy charts. No vanity metrics. Just uptime and clarity.',
		},
	]

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			{/* Hero */}
			<section className="py-24 px-6 text-center border-b border-slate-800">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
						<span className="text-slate-300">boring</span>
						<span className="text-emerald-400">status</span>
					</h1>

					<p className="text-2xl md:text-3xl text-slate-300 mb-4">
						Uptime monitoring you don’t have to think about
					</p>

					<p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
						boringstatus is a calm, reliable uptime monitoring and status page
						service for teams who value trust, clarity, and sleep.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							size="lg"
							className="bg-emerald-500 hover:bg-emerald-600 text-slate-950"
						>
							Get Started
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="bg-slate-600 border-slate-700 text-slate-200 hover:bg-slate-800"
						>
							View Demo Status Page
						</Button>
					</div>

					<p className="text-sm text-slate-500 mt-6">
						Trusted by teams who prefer boring infrastructure.
					</p>
				</div>
			</section>

			{/* Features */}
			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature, index) => (
						<Card
							key={index}
							className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors"
						>
							<CardHeader>
								<div className="mb-4">{feature.icon}</div>
								<CardTitle className="text-slate-100">
									{feature.title}
								</CardTitle>
								<CardDescription className="text-slate-400">
									{feature.description}
								</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</section>
		</div>
	)
}
