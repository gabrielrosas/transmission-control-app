import { Outlet } from 'react-router-dom'
import { SettingsBtn } from '../components/settingsBtn'
import { Page } from '../components/containers'

export function HomeLayout() {
  return (
    <Page.Container>
      <SettingsBtn />
      <main className="p-4">
        <Outlet />
      </main>
    </Page.Container>
  )
}
