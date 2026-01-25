import React from 'react'
import { createRouter, createRoute, createHashHistory } from '@tanstack/react-router'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import Layout from './layouts'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from 'sonner'
import { NotFoundPage } from './components/not-found-page'
import { HomePage } from './pages/home-page'
import { StrategiesPage } from './pages/strategies-page'
import { InstanceDetailsPage } from './pages/instance-details-page'
import { AppLayout } from './components/app-layout'
import { MarketDataProvider } from './components/market-data-provider'

// Create root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster richColors />
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <Layout>
      <NotFoundPage />
    </Layout>
  ),
})

// Create index route (home page)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Layout className="gap-6">
      <ThemeProvider>
        <MarketDataProvider>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </MarketDataProvider>
      </ThemeProvider>
    </Layout>
  ),
})

// Create strategies route
const strategiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/strategies',
  component: () => (
    <Layout>
      <ThemeProvider>
        <MarketDataProvider>
          <AppLayout>
            <StrategiesPage />
          </AppLayout>
        </MarketDataProvider>
      </ThemeProvider>
    </Layout>
  ),
})

// Create strategy instance route with param
const strategyInstanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/strategy-instance/$id',
  component: () => (
    <Layout>
      <ThemeProvider>
        <MarketDataProvider>
          <AppLayout>
            <InstanceDetailsPage />
          </AppLayout>
        </MarketDataProvider>
      </ThemeProvider>
    </Layout>
  ),
})

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  strategiesRoute,
  strategyInstanceRoute,
])

// Create hash history
const hashHistory = createHashHistory()

// Create router
export const router = createRouter({
  routeTree,
  history: hashHistory,
})

// Register router types for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
