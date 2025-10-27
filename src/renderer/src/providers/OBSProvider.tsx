import { useOBSInit } from '@renderer/hooks/obs'

export function OBSProvider({ children }: { children: React.ReactNode }) {
  useOBSInit()
  return children
}
