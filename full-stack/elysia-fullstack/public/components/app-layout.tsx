import type { PropsWithChildren } from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Demo App</h1>
        </div>
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <a href="#/">Home</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#/about">About</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#/services">Services</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#/contact">Contact</a>
          </Button>
        </nav>
      </header>
      <Separator />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
