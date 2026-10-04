import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { CampaignStatus } from '../components/CampaignStatus'
import { HunterChoice } from '../components/HunterChoice'
import { InviteConfirmation } from '../components/InviteConfirmation'
import { SyncNotice } from '../components/SyncNotice'
import { findHunter } from '../campaign/campaign'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  const { status, data, hunterId, pendingInvite } = useSelector(state => state.campaign)
  const pathname = useLocation({ select: location => location.pathname })

  if (pendingInvite) {
    return <InviteConfirmation />
  }

  if (status === 'loading') {
    return <CampaignStatus title="Carregando campanha…" />
  }

  const isGmView = pathname === '/gm' || pathname.startsWith('/gm/')

  if (status === 'no-campaign') {
    return (
      <CampaignStatus
        title="Você ainda não está numa campanha"
        text="Peça o Convite ao GM e abra o link dele neste aparelho."
      />
    )
  }

  if (isGmView) {
    return <Outlet />
  }

  if (status !== 'ready') {
    return (
      <CampaignStatus
        title="Não foi possível carregar a campanha"
        text="Confira sua conexão. Se continuar, avise o GM: o arquivo da campanha pode estar com problema."
      />
    )
  }

  if (!findHunter(data, hunterId)) {
    return <HunterChoice />
  }

  return (
    <>
      <SyncNotice />
      <Outlet />
    </>
  )
}
