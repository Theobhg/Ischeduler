import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/home/page'
import { SchedulePage } from './pages/schedule/page'
import { DashboardLayout } from './pages/layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/schedule',
        element: <SchedulePage />,
      },
    ],
  },
])
