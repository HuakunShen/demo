import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@public/components/theme-provider'

import Layout from '@public/layouts'
import { Button } from './components/ui/button'

function App() {
	const [count, setCount] = useState(0)
	const increase = () => setCount((c) => c + 1)

	return (
		<ThemeProvider>
			<img src="/images/maddelena-1.webp" className="max-w-40" />
			<h1 className="text-3xl">Bun/Elysia Fullstack</h1>
			<h2 className="text-6xl">{count}</h2>
			<Button onClick={increase}>Increase</Button>
		</ThemeProvider>
	)
}

const root = createRoot(document.getElementById('elysia')!)
root.render(
	<Layout className="gap-6">
		<App />
	</Layout>
)
