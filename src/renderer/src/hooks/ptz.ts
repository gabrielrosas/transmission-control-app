import { useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../schemas/CameraPTZ'
import Axis from '../libs/ptzRequests'

export function usePTZ(camera: CameraPTZConfig) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ptz', camera.id],
    queryFn: () => getPresets(camera)
  })

  console.log(data, isLoading, error)
}

async function getPresets(camera: CameraPTZConfig) {
  console.log(camera)
  const axis = new Axis(camera.ip, camera.user, camera.password)
  console.log(axis)
  const info = await axis.ptz.info()
  console.log(info)
  return info
}
