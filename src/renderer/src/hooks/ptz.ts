import { useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../schemas/CameraPTZ'

export function usePTZ(camera: CameraPTZConfig) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ptz', camera.id],
    // @ts-ignore (define in dts)
    queryFn: () => window.ptz.getPresets()
  })

  console.log({ data, isLoading, error })
  return { data, isLoading, error }
}
