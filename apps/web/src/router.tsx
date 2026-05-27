import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/home/page'
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
    ],
  },
])
