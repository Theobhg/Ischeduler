import { Outlet } from 'react-router'

export function HomeLayout() {
  return (
    <main className="p-6 w-full">
      <Outlet />
    </main>
  )
}
