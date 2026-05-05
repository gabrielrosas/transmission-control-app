import { useConfig } from '@renderer/hooks/config'
import { Box } from '../../components/Box'
import { ObsCard } from './obs'
import { PtzCard } from './ptz'
import { OverlayerCard } from './overlayers'
import { useState } from 'react'
import { PTZManagerProvider } from '@renderer/hooks/ptz/Manager'

export function HomePage() {
  const cameraPTZConfig = useConfig((state) => state.config.cameraPTZConfig)
  const overlayerControls = useConfig((state) => state.config.overlayerControls)
  const [selected, setSelected] = useState<string | null>(Object.keys(cameraPTZConfig)[0] || null)
  return (
    <Box direction="column" gap="small" className="h-full" align="start">
      <PTZManagerProvider>
        {Object.values(cameraPTZConfig).map((camera) => (
          <PtzCard
            key={camera.id}
            camera={camera}
            selected={selected === camera.id}
            changeColapsed={() => setSelected(selected === camera.id ? null : camera.id)}
          />
        ))}
        {Object.values(overlayerControls).map((control) => (
          <OverlayerCard
            key={control.id}
            control={control}
            selected={selected === control.id}
            changeColapsed={() => setSelected(selected === control.id ? null : control.id)}
          />
        ))}
      </PTZManagerProvider>
      <ObsCard />
    </Box>
  )
}
