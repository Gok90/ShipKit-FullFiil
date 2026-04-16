import { ShipKitProvider } from '@/lib/shipkit-context'
import { AppShell } from '@/components/app-shell'

export default function HomePage() {
  return (
    <ShipKitProvider>
      <AppShell />
    </ShipKitProvider>
  )
}
