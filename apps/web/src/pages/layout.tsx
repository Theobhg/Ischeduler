import { AnimatePresence } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { PageMotion } from '@/components/motion/page-motion'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export function DashboardLayout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar variant="floating" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AnimatePresence mode="wait">
            <PageMotion key={location.pathname} className="flex flex-1 flex-col">
              <Outlet />
            </PageMotion>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
