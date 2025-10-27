import { AuthProvider } from './AuthProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OBSProvider } from './OBSProvider'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OBSProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </OBSProvider>
    </AuthProvider>
  )
}
