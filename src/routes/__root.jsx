import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { CampaignStatus } from '../components/CampaignStatus'
import { HunterChoice } from '../components/HunterChoice'
import { findHunter } from '../campaign/campaign'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  const { status, data, hunterId } = useSelector(state => state.campaign)

  if (status === 'loading') {
    return <CampaignStatus title="Carregando campanha…" />
  }

  if (status === 'no-campaign') {
    return (
      <CampaignStatus
        title="Você ainda não está numa campanha"
        text="Peça o Convite ao GM e abra o link dele neste aparelho."
      />
    )
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
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}
