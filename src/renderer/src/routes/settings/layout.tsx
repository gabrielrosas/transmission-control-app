import { Link, Outlet } from 'react-router-dom'
import { Button } from '../../components/Button'
import { OBSIcon } from '../../components/icons/obs'
import { HouseIcon, WebcamIcon, LogOut } from 'lucide-react'
import { Separator } from '../../components/navbar/Separator'
import { Page } from '../../components/containers'
import { useAuth } from '../../hooks/firebase'
import { useConfirm } from '@renderer/hooks/utils/confirm'

export function SettingsLayout() {
  const signOut = useAuth((state) => state.signOut)

  const { component: confirmSignOut, open: openSignOut } = useConfirm({
    title: 'Tem certeza que deseja sair?',
    description: 'Esta ação irá desconectar você do sistema.',
    labelConfirm: 'Sair',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) {
        await signOut()
      }
    }
  })

  return (
    <Page.Container className="h-full">
      <nav className="fixed bg-background top-0 left-0 w-screen flex items-center border-b border-border">
        <Button asChild icon={HouseIcon} variant="nav">
          <Link to="/"></Link>
        </Button>
        <Separator />
        <Button asChild icon={OBSIcon} variant="nav">
          <Link to="/settings/obs">OBS</Link>
        </Button>
        <Button asChild icon={WebcamIcon} variant="nav">
          <Link to="/settings/ptz">PTZ</Link>
        </Button>
        <div className="flex-1" />
        <Separator />
        <Button variant="nav" onClick={openSignOut}>
          <LogOut size={16} />
        </Button>
      </nav>
      <main className="p-2 pt-[44px] h-full flex flex-col items-center ">
        <Outlet />
      </main>
      {confirmSignOut}
    </Page.Container>
  )
}
