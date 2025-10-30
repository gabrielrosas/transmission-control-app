import { PTZContext, PTZContextType } from './hooks'

type PTZControlProps = {
  children: React.ReactNode
  control: PTZContextType
}
export function PTZControl({ children, control }: PTZControlProps) {
  return <PTZContext.Provider value={control}>{children}</PTZContext.Provider>
}
