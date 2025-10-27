import { useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../schemas/CameraPTZ'

export function usePTZ(camera: CameraPTZConfig) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ptz', camera.id],
    queryFn: () => getPresets(camera)
  })

  console.log(data, isLoading, error)
}

async function getPresets(camera: CameraPTZConfig) {
  const response = await fetch(
    `http://${camera.ip}:${camera.port}/axis-cgi/com/ptz.cgi?info=1&camera=1`,
    {
      headers: {
        Authorization: `Basic ${btoa(`${camera.user}:${camera.password}`)}`
      },
      mode: 'no-cors'
    }
  )
  return response.json()
}
