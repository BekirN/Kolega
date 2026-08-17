import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#E2DDD6' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}