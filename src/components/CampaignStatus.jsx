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
    font-size: 1.6rem;
    line-height: 1.2;
  }

  p {
    font-size: 14px;
    color: #777;
    line-height: 1.5;
  }
`
