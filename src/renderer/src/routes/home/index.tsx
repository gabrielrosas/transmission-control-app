import { useConfig } from '@renderer/hooks/config'
import { Box } from '../../components/Box'
import { ObsCard } from './obs'
import { PtzCard } from './ptz'
import { useState } from 'react'
import { PTZManagerProvider } from '@renderer/hooks/ptz/Manager'
// import { OverlayersCard } from './overlayers'

export function HomePage() {
  const cameraPTZConfig = useConfig((state) => state.config.cameraPTZConfig)
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
        {/* <OverlayersCard
          selected={selected === 'overlayers'}
          changeColapsed={() => setSelected(selected === 'overlayers' ? null : 'overlayers')}
        /> */}
      </PTZManagerProvider>
      <ObsCard />
    </Box>
  )
}
