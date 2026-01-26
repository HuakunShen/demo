import React from 'react'
import { createRouter, createRoute, createHashHistory } from '@tanstack/react-router'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import Layout from './layouts'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from 'sonner'
import { NotFoundPage } from './components/not-found-page'
import { HomePage } from './pages/home-page'
import { AboutPage } from './pages/about-page'
import { ServicesPage } from './pages/services-page'
import { ContactPage } from './pages/contact-page'
import { AppLayout } from './components/app-layout'

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
    <Layout>
      <ThemeProvider>
        <AppLayout>
          <HomePage />
        </AppLayout>
      </ThemeProvider>
    </Layout>
  ),
})

// Create about route
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: () => (
    <Layout>
      <ThemeProvider>
        <AppLayout>
          <AboutPage />
        </AppLayout>
      </ThemeProvider>
    </Layout>
  ),
})

// Create services route
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: () => (
    <Layout>
      <ThemeProvider>
        <AppLayout>
          <ServicesPage />
        </AppLayout>
      </ThemeProvider>
    </Layout>
  ),
})

// Create contact route
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: () => (
    <Layout>
      <ThemeProvider>
        <AppLayout>
          <ContactPage />
        </AppLayout>
      </ThemeProvider>
    </Layout>
  ),
})

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  contactRoute,
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
