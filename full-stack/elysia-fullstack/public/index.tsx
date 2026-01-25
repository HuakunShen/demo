import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@public/router'

const root = createRoot(document.getElementById('elysia')!)
root.render(<RouterProvider router={router} />)
