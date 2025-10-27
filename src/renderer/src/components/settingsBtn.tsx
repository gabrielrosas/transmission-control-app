import { SettingsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsBtn() {
  return (
    <Link
      to="/settings/obs"
      className="fixed top-0 right-0 w-[30px] h-[30px] flex items-center justify-center border-b border-l bg-popover border-border rounded-bl-lg hover:bg-popover-hover"
    >
      <SettingsIcon className="size-4" />
    </Link>
  )
}
