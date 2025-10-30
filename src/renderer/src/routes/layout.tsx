import { Outlet } from 'react-router-dom'
import { SettingsBtn } from '../components/settingsBtn'
import { Page } from '../components/containers'

export function HomeLayout() {
  return (
    <Page.Container className="h-full">
      <SettingsBtn />
      <main className="p-2 pt-[40px] h-full">
        <Outlet />
      </main>
    </Page.Container>
  )
}
