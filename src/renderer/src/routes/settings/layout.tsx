import { Link, Outlet } from 'react-router-dom'
import { Button } from '../../components/Button'
import { OBSIcon } from '../../components/icons/obs'
import { HouseIcon, WebcamIcon, LogOut, Loader2 } from 'lucide-react'
import { Separator } from '../../components/navbar/Separator'
import { Page } from '../../components/containers'
import { useAuth } from '../../hooks/firebase'
import { DialogConfirmProvider } from '../../components/Dialog'
import { useConfirm } from '@renderer/hooks/utils'
import { useMutation } from '@tanstack/react-query'

export function SettingsLayout() {
  const signOut = useAuth((state) => state.signOut)
  const confirm = useConfirm()

  const { mutate: handleSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      const confirmed = await confirm({
        title: 'Tem certeza que deseja sair?',
        description: 'Esta ação irá desconectar você do sistema.'
      })
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
        <Button variant="nav" title="Sair" onClick={() => handleSignOut()}>
          {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        </Button>
      </nav>
      <main className="p-2 pt-[44px] h-full flex flex-col items-center ">
        <Outlet />
      </main>
      <DialogConfirmProvider />
    </Page.Container>
  )
}
