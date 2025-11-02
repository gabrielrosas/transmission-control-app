import { PTZContext, PTZContextType, PTZPresetContext, PTZPreset, useInitPTZPreset } from './hooks'

type PTZControlProps = {
  children: React.ReactNode
  control: PTZContextType
}

export function PTZControl({ children, control }: PTZControlProps) {
  return <PTZContext.Provider value={control}>{children}</PTZContext.Provider>
}

type PTZPresetControlProps = {
  children: React.ReactNode
  preset: PTZPreset
}

export function PTZPresetControl({ children, preset }: PTZPresetControlProps) {
  const value = useInitPTZPreset(preset)
  return <PTZPresetContext.Provider value={value}>{children}</PTZPresetContext.Provider>
}
