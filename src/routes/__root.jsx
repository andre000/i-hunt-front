import PropTypes from 'prop-types'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { CampaignStatus } from '../components/CampaignStatus'
import { HunterChoice } from '../components/HunterChoice'
import { InviteConfirmation } from '../components/InviteConfirmation'
import { SyncNotice } from '../components/SyncNotice'
import { DemoWelcome } from '../components/DemoWelcome'
import { DemoBar, DemoErrorActions } from '../components/DemoBar'
import { findHunter } from '../campaign/hunters'

export const Route = createRootRoute({
  component: Root,
})

function NoCampaign() {
  return (
    <CampaignStatus
      title="Você ainda não está numa campanha"
      text="Peça o Convite ao GM e abra o link dele neste aparelho."
    >
      <a className="button secondary" href="/demo">Ver demonstração</a>
    </CampaignStatus>
  )
}

function LoadFailed({ demo }) {
  return (
    <CampaignStatus
      title="Não foi possível carregar a campanha"
      text="Confira sua conexão. Se continuar, avise o GM: o arquivo da campanha pode estar com problema."
    >
      {demo && <DemoErrorActions />}
    </CampaignStatus>
  )
}

LoadFailed.propTypes = {
  demo: PropTypes.bool.isRequired,
}

function PlayerScreen({ data, hunterId, demo }) {
  if (demo && !demo.introSeen) return <DemoWelcome />
  if (!findHunter(data, hunterId)) return <HunterChoice />
  return (
    <>
      <SyncNotice />
      <Outlet />
    </>
  )
}

PlayerScreen.propTypes = {
  data: PropTypes.object.isRequired,
  hunterId: PropTypes.string,
  demo: PropTypes.shape({ introSeen: PropTypes.bool.isRequired }),
}

function RootScreen({ isGmView, isEditor }) {
  const { status, data, hunterId, pendingInvite, demo } = useSelector(state => state.campaign)

  if (pendingInvite) return <InviteConfirmation />
  if (isEditor) return <Outlet />
  if (status === 'loading') return <CampaignStatus title="Carregando campanha…" />
  if (status === 'no-campaign') return <NoCampaign />
  if (isGmView) return <Outlet />
  if (status !== 'ready') return <LoadFailed demo={Boolean(demo)} />
  return <PlayerScreen data={data} hunterId={hunterId} demo={demo} />
}

RootScreen.propTypes = {
  isGmView: PropTypes.bool.isRequired,
  isEditor: PropTypes.bool.isRequired,
}

function Root() {
  const demo = useSelector(state => state.campaign.demo)
  const pathname = useLocation({ select: location => location.pathname })
  const isGmView = pathname === '/gm' || pathname.startsWith('/gm/')
  const showBar = demo?.introSeen && !isGmView

  return (
    <>
      {showBar && <DemoBar />}
      <RootScreen isGmView={isGmView} isEditor={pathname === '/gm/editor'} />
    </>
  )
}
