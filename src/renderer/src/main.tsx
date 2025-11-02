import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import './style.css'
import './hooks/firebase'

import { Toaster } from 'react-hot-toast'
import { HomeLayout } from './routes/layout'
import { HomePage } from './routes/home'
import { SettingsLayout } from './routes/settings/layout'
import { ObsPage } from './routes/settings/obs'
import { PtzPage } from './routes/settings/ptz'
import { Providers } from './providers'

const router = createHashRouter([
  {
    path: '/',
    element: <HomeLayout />,
    children: [{ index: true, element: <HomePage /> }]
  },
  {
    path: '/settings',
    element: <SettingsLayout />, // layout principal de Settings
    children: [
      { path: 'obs', element: <ObsPage /> },
      { path: 'ptz', element: <PtzPage /> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
    <Toaster
      toastOptions={{
        className: 'bg-popover! text-white! shadow-tooltip!'
      }}
    />
  </StrictMode>
)
