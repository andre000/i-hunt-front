/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useDispatch } from 'react-redux'
import { dismissDemoIntro } from '../store/campaign'

const STEPS = [
  'Pick a hunter.',
  'Open a hunt on the map.',
  'Read the messages from the characters.',
]

export function DemoWelcome() {
  const dispatch = useDispatch()

  return (
    <main css={welcome} lang="en">
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 16px;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 20px calc(24px + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(circle at 20% 15%, rgb(255 107 26 / 12%), transparent 50%),
    var(--asfalto);

  .welcome__logo {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin-bottom: auto;

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
