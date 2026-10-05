/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import Logo from './Logo'
import { centeredScreen } from './styles'

export function CampaignStatus({ title, text }) {
  return (
    <main css={[centeredScreen, campaignStatus]}>
      <Logo />
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </main>
  )
}

CampaignStatus.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string,
}

const campaignStatus = css`
  h1 {
    font-size: 1.8rem;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  p {
    font-size: 14px;
    color: var(--apagado);
    line-height: 1.5;
  }
`
