/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDispatch, useSelector } from 'react-redux'
import { dismissDemoIntro } from '../store/campaign'
import { visibleMissions } from '../campaign/missions'
import { MissionMap } from './MissionMap'

const OPEN_STATUSES = ['available', 'in-progress']

const STEPS = [
  'Pick a hunter.',
  'Open a hunt on the map.',
  'Read the messages from the characters.',
]

export function DemoWelcome() {
  const dispatch = useDispatch()
  const data = useSelector(state => state.campaign.data)
  const missions = visibleMissions(data).filter(mission => OPEN_STATUSES.includes(mission.status) && mission.position)

  return (
    <main css={welcome} lang="en">
      <div className="welcome__city" aria-hidden="true">
        {missions.length > 0 && <MissionMap className="welcome__map" missions={missions} interactive={false} />}
      </div>
      <div className="welcome__logo" aria-hidden="true"><span>i</span>Hunt</div>
      <h1>A gig app for monster hunters</h1>
      <p>
        iHunt is a companion app for the iHunt tabletop RPG, where broke millennials pay the bills by hunting
        monsters through an Uber-style app. This is that app: players open it at the table to pick up hunts and
        read messages from the Game Master&apos;s characters.
      </p>
      <h2>Try this</h2>
      <ol>
        {STEPS.map(step => <li key={step}>{step}</li>)}
        <li><span>Tap <b lang="pt-BR">Avançar a noite</b> in the top bar to move the story forward.</span></li>
      </ol>
      <p className="welcome__note">The app itself is in Brazilian Portuguese, like the campaign it runs.</p>
      <button type="button" className="button primary" onClick={() => dispatch(dismissDemoIntro())}>
        Start demo
      </button>
    </main>
  )
}

const welcome = css`
  position: relative;
  isolation: isolate;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px calc(24px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(circle at 20% 15%, rgb(255 107 26 / 12%), transparent 50%),
    var(--asfalto);

  .welcome__city {
    position: relative;
    flex: 1 0 140px;
    margin: 0 -20px 4px;
    animation: city-in 1.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .welcome__city::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgb(12 14 17 / 35%) 0%, rgb(12 14 17 / 5%) 45%, var(--asfalto) 100%);
    pointer-events: none;
  }

  .welcome__map {
    position: absolute;
    inset: 0;

    .leaflet-bottom {
      top: calc(8px + env(safe-area-inset-top, 0px));
      bottom: auto;
    }
  }

  @keyframes city-in {
    from { opacity: 0; transform: scale(1.06); }
    to { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .welcome__city { animation: none; }
  }

  .welcome__logo {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.04em;
    position: absolute;
    top: calc(20px + env(safe-area-inset-top, 0px));
    left: 20px;
    z-index: 1;

    span {
      color: var(--laranja);
    }
  }

  h1 {
    font-size: 32px;
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  p {
    color: var(--apagado);
    font-size: 15px;
    max-width: 46ch;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
    border-top: 1px solid var(--linha);
  }

  li {
    counter-increment: step;
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--linha);
    font-size: 15px;
  }

  li::before {
    content: counter(step);
    font-family: var(--mono);
    color: var(--laranja);
  }

  .welcome__note {
    font-size: 13px;
  }

  .button {
    height: 52px;
    font-size: 16px;
    font-weight: 700;
  }
`
