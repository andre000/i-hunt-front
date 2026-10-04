/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDispatch, useSelector } from 'react-redux'
import Logo from './Logo'
import { centeredScreen } from './styles'
import { keepCurrentCampaign, switchCampaign } from '../store/campaign'

export function InviteConfirmation() {
  const dispatch = useDispatch()
  const pendingInvite = useSelector(state => state.campaign.pendingInvite)
  const currentName = useSelector(state => state.campaign.data?.campaign.name)

  return (
    <main css={[centeredScreen, inviteConfirmation]}>
      <Logo />
      <h1>Trocar de campanha?</h1>
      <p>
        Você abriu o Convite de outra campanha.
        {currentName ? ` Este aparelho está na campanha "${currentName}".` : ''}
        {' '}Ao trocar, você vai escolher seu hunter de novo.
      </p>
      <button type="button" className="button primary" onClick={() => dispatch(switchCampaign(pendingInvite))}>
        Trocar de campanha
      </button>
      <button type="button" className="button secondary" onClick={() => dispatch(keepCurrentCampaign())}>
        Manter a atual
      </button>
    </main>
  )
}

const inviteConfirmation = css`
  h1 {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  p {
    font-size: 14px;
    color: #777;
    line-height: 1.5;
  }

  .button {
    height: 48px;
    font-weight: 700;
  }
`
