/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDispatch } from 'react-redux'
import { exitDemo, reloadCampaign } from '../store/campaign'

export function DemoErrorActions() {
  const dispatch = useDispatch()
  return (
    <div css={errorActions}>
      <button type="button" className="button primary" onClick={() => dispatch(reloadCampaign())}>Tentar de novo</button>
      <button type="button" className="button secondary" onClick={() => dispatch(exitDemo())}>Sair da demo</button>
    </div>
  )
}

const errorActions = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`
