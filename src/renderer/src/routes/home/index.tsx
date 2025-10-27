import { Box } from '../../components/Box'
import { ObsCard } from './obs'
import { PtzCard } from './ptz'

export function HomePage() {
  return (
    <>
      <Box direction="row" gap="medium" className="mt-[25px]" align="start">
        <ObsCard />
        <PtzCard />
      </Box>
    </>
  )
}
