import { Link, Outlet } from 'react-router-dom'
import { Button } from '../../components/Button'
import { OBSIcon } from '../../components/icons/obs'
import { HouseIcon, WebcamIcon, LogOut } from 'lucide-react'
import { Separator } from '../../components/navbar/Separator'
import { Page } from '../../components/containers'
import { useAuth } from '../../hooks/firebase'

export function SettingsLayout() {
  const signOut = useAuth((state) => state.signOut)
  return (
    <Page.Container>
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
        <Button variant="nav" onClick={signOut} title="Sair">
          <LogOut size={16} />
        </Button>
      </nav>
      <div className="mt-[50px] p-4 flex flex-col items-center min-h-[calc(100vh-50px)]">
        <Outlet />
      </div>
    </Page.Container>
  )
}
