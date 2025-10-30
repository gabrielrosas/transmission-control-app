import { Box } from '../../components/Box'
import { ObsCard } from './obs'
import { PtzCards } from './ptz'

export function HomePage() {
  return (
    <>
      <Box direction="column" gap="small" className="h-full" align="start">
        <PtzCards />
        <ObsCard />
      </Box>
    </>
  )
}
