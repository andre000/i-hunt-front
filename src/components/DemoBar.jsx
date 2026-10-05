/** @jsxImportSource @emotion/react */
import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { css } from '@emotion/react'
import { useDispatch, useSelector } from 'react-redux'
import { advanceNight, clearDemoChanges, exitDemo, reloadCampaign, restartDemo } from '../store/campaign'
import { describeChanges } from '../campaign/nightChanges'

const NEWS_MS = 5000

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

function DemoNews({ changes }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const timer = setTimeout(() => dispatch(clearDemoChanges()), NEWS_MS)
    return () => clearTimeout(timer)
  }, [changes, dispatch])

  return <p role="status" className="demo__news">{describeChanges(changes)}</p>
}

DemoNews.propTypes = {
  changes: PropTypes.shape({
    newMissionIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    messages: PropTypes.number.isRequired,
    expired: PropTypes.number.isRequired,
  }).isRequired,
}

export function DemoBar() {
  const dispatch = useDispatch()
  const { night, lastNight, changes } = useSelector(state => state.campaign.demo)
  const atEnd = night >= lastNight

  return (
    <div css={bar}>
      <div className="demo__row">
        <span className="demo__label">Demo · <b className="num">Noite {night}</b></span>
        <button
          type="button"
          className="button primary demo__advance"
          onClick={() => dispatch(atEnd ? restartDemo() : advanceNight())}
        >
          {atEnd ? 'Recomeçar demo' : 'Avançar a noite'}
        </button>
        <button type="button" className="demo__exit" onClick={() => dispatch(exitDemo())}>Sair</button>
      </div>
      {changes && <DemoNews changes={changes} />}
    </div>
  )
}

const bar = css`
  flex-shrink: 0;
  position: relative;
  z-index: 20;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;
  background-color: var(--painel);
  border-bottom: 1px solid var(--linha);

  .demo__row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .demo__label {
    flex: 1;
    font-size: 13px;
    color: var(--apagado);

    b {
      color: var(--texto);
      font-weight: 500;
    }
  }

  .demo__advance {
    padding: 7px 12px;
    font-size: 13px;
    font-weight: 700;
    border-radius: 999px;
  }

  .demo__exit {
    padding: 7px 4px;
    background: none;
    color: var(--apagado);
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .demo__exit:hover {
    color: var(--texto);
  }

  .demo__news {
    animation: news-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 12px;
    background-color: var(--laranja-fundo);
    color: var(--laranja);
    font-size: 13px;
    font-weight: 600;
  }

  @keyframes news-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .demo__news { animation: none; }
  }
`
