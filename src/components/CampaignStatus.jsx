/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import Logo from './Logo'
import { centeredScreen } from './styles'

export function CampaignStatus({ title, text, children }) {
  return (
    <main css={[centeredScreen, campaignStatus]}>
      <Logo />
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      {children}
    </main>
  )
}

CampaignStatus.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string,
  children: PropTypes.node,
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

  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 52px;
    font-size: 16px;
  }
`
