/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { chooseHunter } from '../store/campaign'
import { visibleMissions } from '../campaign/missions'
import { Avatar } from './Avatar'
import { CampaignClock } from './CampaignClock'
import { MissionMap } from './MissionMap'
import { SignalReveal } from './SignalReveal'
import { TIMELINE, useSignalIntro } from './useSignalIntro'

const SLOGANS = [
  "Monstros à solta? Seu bico agora é caçá-los!",
  "Transforme medo em renda com #iHunt.",
  "Acabe com os monstros e com suas contas!",
  "Cace monstros. Pague boletos. Viva melhor.",
  "Seu novo trabalho? Ser um herói urbano!",
  "O bico mais assustador e lucrativo da cidade.",
  "Caçar monstros nunca foi tão rentável!",
  "Monstros à vista? Faça dinheiro com isso!",
  "Salve o mundo e seu orçamento com #iHunt.",
]

const slogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)]

const LEAVE_MS = 480
const OPEN_STATUSES = ['available', 'in-progress']

function HunterRow({ hunter, index, disabled, onChoose }) {
  return (
    <li style={{ '--i': index }}>
      <button type="button" onClick={() => onChoose(hunter.id)} disabled={disabled}>
        <Avatar person={hunter} size={40} />
        <span className="choice__name">{hunter.name}</span>
        {hunter.rating !== undefined && (
          <span className="choice__rating num" aria-hidden="true">
            <StarIcon /> {hunter.rating.toFixed(1)}
          </span>
        )}
        <ArrowRightIcon className="choice__arrow" aria-hidden="true" />
      </button>
    </li>
  )
}

HunterRow.propTypes = {
  hunter: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, rating: PropTypes.number }).isRequired,
  index: PropTypes.number.isRequired,
  disabled: PropTypes.bool.isRequired,
  onChoose: PropTypes.func.isRequired,
}

export function HunterChoice () {
  const data = useSelector(state => state.campaign.data)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const logoRef = useRef(null)
  const letterRef = useRef(null)
  const { intro, done, skipped, skip, fallback, revealFrom, stateClasses } = useSignalIntro({ main: mainRef, logo: logoRef, letter: letterRef })
  const [leaving, setLeaving] = useState(false)

  const missions = visibleMissions(data).filter(mission => OPEN_STATUSES.includes(mission.status) && mission.position)

  const handleChoose = (hunterId) => {
    if (leaving) return
    setLeaving(true)
    const go = () => {
      dispatch(chooseHunter(hunterId))
      navigate({ to: '/', state: { referer: 'login' } })
    }
    setTimeout(go, intro?.mode === 'calm' ? 0 : LEAVE_MS)
  }

  const classes = [...stateClasses, leaving && 'is-leaving'].filter(Boolean).join(' ')
  const originStyle = intro?.origin && { '--ox': `${intro.origin.x}px`, '--oy': `${intro.origin.y}px` }

  return (
    <main
      ref={mainRef}
      css={choice}
      className={classes}
      style={originStyle || undefined}
      onPointerDown={skip}
      onKeyDown={skip}
    >
      <div className="choice__stage">
        {intro && missions.length > 0 && (
          <MissionMap className="choice__map" missions={missions} interactive={false} revealFrom={revealFrom} />
        )}
      </div>

      {intro?.mode === 'signal' && !done && (
        <SignalReveal origin={intro.origin} start={intro.start} timeline={TIMELINE} skipped={skipped} onFallback={fallback} />
      )}

      <div className="choice__top">
        <div className="choice__logo" ref={logoRef} aria-label="iHunt">
          <span ref={letterRef} className="choice__i">i</span>Hunt
        </div>
        <CampaignClock className="choice__clock" />
      </div>

      <p className="choice__slogan">{slogan}</p>

      <section className="choice__sheet" aria-labelledby="choice-title">
        <span className="choice__grip" aria-hidden="true" />
        <div>
          <h2 id="choice-title">Quem é você nesta campanha?</h2>
          <p>{data.campaign.name}</p>
        </div>
        <ul>
          {data.hunters.map((hunter, index) => (
            <HunterRow key={hunter.id} hunter={hunter} index={index} disabled={leaving} onChoose={handleChoose} />
          ))}
        </ul>
      </section>
    </main>
  )
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const choice = css`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--asfalto);
  isolation: isolate;

  .choice__stage {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at var(--ox, 50%) var(--oy, 38%), rgb(255 107 26 / 10%), transparent 55%),
      #111419;
    transition: transform ${LEAVE_MS}ms ${EASE};
  }

  .choice__stage::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(180deg, rgb(12 14 17 / 55%) 0%, transparent 22%, transparent 45%, var(--asfalto) 80%);
  }

  .choice__map {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .choice__top {
    position: relative;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 0;
    transition: opacity 0.25s ease;
  }

  .choice__logo {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    transform-origin: 0 0;
  }

  .choice__i {
    color: var(--laranja);
  }

  .choice__slogan {
    position: relative;
    z-index: 3;
    margin-top: auto;
    padding: 0 16px 18px;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.035em;
    text-wrap: balance;
    max-width: 14ch;
    transition: opacity 0.25s ease;
  }

  .choice__sheet {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 18px calc(18px + env(safe-area-inset-bottom, 0px));
    background-color: var(--painel);
    border-top: 1px solid var(--linha);
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -20px 40px -10px rgb(0 0 0 / 70%);
    transition: transform ${LEAVE_MS}ms ${EASE};

    h2 {
      font-size: 17px;
    }

    p {
      font-size: 13px;
      color: var(--apagado);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      border-top: 1px solid var(--linha);
    }

    li + li {
      border-top: 1px solid var(--linha);
    }

    button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-radius: 0;
      background: none;
      color: var(--texto);
      text-align: left;
    }

    button:hover .choice__name,
    button:hover .choice__arrow {
      color: var(--laranja);
    }

    button:hover .choice__arrow {
      transform: translateX(3px);
    }
  }

  .choice__grip {
    width: 36px;
    height: 4px;
    border-radius: 4px;
    background-color: var(--linha);
    align-self: center;
  }

  .choice__name {
    flex: 1;
    min-width: 0;
    font-size: 16px;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .choice__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--apagado);

    svg {
      width: 13px;
      height: 13px;
      color: var(--aviso);
    }
  }

  .choice__arrow {
    width: 20px;
    height: 20px;
    color: var(--apagado);
    transition: color 0.2s ease, transform 0.3s ${EASE};
  }

  &.is-signal,
  &.is-fallback {
    .choice__i {
      animation: ignite 0.6s ease-out ${TIMELINE.beacon}ms both;
    }

    .choice__clock {
      animation: rise 0.6s ${EASE} ${TIMELINE.logo + 150}ms both;
    }

    .choice__slogan {
      animation: rise 0.7s ${EASE} ${TIMELINE.logo + 250}ms both;
    }

    .choice__sheet {
      animation: sheet-in 0.8s ${EASE} ${TIMELINE.logo + 350}ms both;
    }

    li {
      animation: rise 0.5s ${EASE} calc(${TIMELINE.logo + 550}ms + var(--i) * 70ms) both;
    }
  }

  &.is-fallback .choice__stage {
    animation: reveal-circle 0.9s cubic-bezier(0.5, 0, 0.2, 1) ${TIMELINE.waves[2]}ms both;
  }

  &:not([class*='is-']) {
    .choice__logo,
    .choice__clock,
    .choice__slogan,
    .choice__sheet {
      opacity: 0;
    }
  }

  &:not(.is-done) .choice__sheet {
    pointer-events: none;
  }

  &.is-skipped {
    .choice__i,
    .choice__clock,
    .choice__slogan,
    .choice__sheet,
    .choice__stage,
    li,
    .pin--reveal {
      animation-delay: 0s !important;
      animation-duration: 0.25s !important;
    }
  }

  &.is-calm {
    .choice__sheet,
    .choice__slogan {
      animation: fade 0.4s ease both;
    }
  }

  &.is-leaving {
    .choice__sheet {
      transform: translateY(105%);
    }

    .choice__slogan,
    .choice__top {
      opacity: 0;
    }

    .choice__stage {
      transform: scale(1.12);
    }
  }

  @keyframes ignite {
    0% { color: var(--texto); text-shadow: none; }
    40% { color: #fff3e8; text-shadow: 0 0 18px rgb(255 107 26 / 90%), 0 0 4px #fff; }
    100% { color: var(--laranja); text-shadow: 0 0 0 transparent; }
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }

  @keyframes sheet-in {
    from { transform: translateY(100%); }
    to { transform: none; }
  }

  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes reveal-circle {
    from { clip-path: circle(0 at var(--ox) var(--oy)); }
    to { clip-path: circle(150% at var(--ox) var(--oy)); }
  }
`
