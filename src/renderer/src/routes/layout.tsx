import { Outlet } from 'react-router-dom'
import { SettingsBtn } from '../components/settingsBtn'
import { Page } from '../components/containers'
// import { DialogConfirmProvider } from '@renderer/components/Dialog'

export function HomeLayout() {
  return (
    <Page.Container className="h-full">
      <SettingsBtn />
      <main className="p-2 pt-[40px] h-full">
        <Outlet />
      </main>
      {/* <DialogConfirmProvider /> */}
    </Page.Container>
  )
}
