import { Content } from '@renderer/components/containers'
import { Subtitle } from '@renderer/components/titles'
import { usePTZ } from '@renderer/hooks/ptz'
import { Webcam } from 'lucide-react'

export function PtzCard() {
  const camera = {
    id: '1',
    name: 'Camera 1',
    user: 'admin',
    ip: '192.168.99.240',
    port: '80',
    password: 'clic3369'
  }
  usePTZ(camera)
  return (
    <Content.Container>
      <Content.Header size="small">
        <Subtitle icon={Webcam}>PTZ</Subtitle>
      </Content.Header>
    </Content.Container>
  )
}
//Basic YWRtaW46Y2xpYzMzNjk=
