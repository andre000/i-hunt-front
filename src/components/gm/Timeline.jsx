/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/16/solid'
import { RiskChip, StatusLabel } from '../MissionTags'
import { campaignClock, time, timeLeft } from '../../campaign/time'
import { formatBRL } from '../../utils/format'

const EARLIER_SHOWN = 6

function dayOf(item) {
  return item.at ? campaignClock(item.at).day : 'Desde o início'
}

function byDay(items) {
  return items.reduce((groups, item) => {
    const day = dayOf(item)
    const last = groups.at(-1)
    if (last?.day === day) last.items.push(item)
    else groups.push({ day, items: [item] })
    return groups
  }, [])
}

function names(list) {
  return list.join(', ')
}

function MissionBody({ item, open, date }) {
  const { mission, scheduled, nearNames } = item
  const left = mission.deadline ? timeLeft(mission.deadline, date) : null

  return (
    <>
      <span className="row__title">{mission.name}</span>
      <span className="row__meta">
        {scheduled ? <span className="row__scheduled">Agendada</span> : <StatusLabel status={mission.status} />}
        <span>{mission.location}</span>
        {mission.hunterNames.length > 0 && <span>com {names(mission.hunterNames)}</span>}
      </span>
      {open && (
        <span className="row__more">
          {mission.description && <span className="row__text">{mission.description}</span>}
          <span className="row__facts">
            <RiskChip risk={mission.risk} />
            {mission.deadline && (
              <span>
                Prazo {campaignClock(mission.deadline).day} · <span className="num">{campaignClock(mission.deadline).hour}</span>
                {left ? ` (faltam ${left})` : ' (passou)'}
              </span>
            )}
            {nearNames.length > 0 && <span>Perto de {names(nearNames)}</span>}
            {!mission.position && <span>Sem posição no mapa</span>}
          </span>
        </span>
      )}
    </>
  )
}

MissionBody.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  date: PropTypes.string.isRequired,
}

function MessageBody({ item, open }) {
  const { npc, recipients, message } = item

  return (
    <>
      <span className="row__title">
        {npc?.name ?? message.npc} <span className="row__to">→ {recipients ? names(recipients) : 'Todos'}</span>
      </span>
      <span className={open ? 'row__text' : 'row__text row__text--short'}>{message.text}</span>
    </>
  )
}

MessageBody.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
}

function Node({ item }) {
  if (item.kind === 'message') {
    return <span className={item.scheduled ? 'node node--message node--scheduled' : 'node node--message'}><ChatBubbleOvalLeftIcon /></span>
  }
  const status = item.scheduled ? 'scheduled' : item.mission.status
  return <span className={`node node--${status}`} />
}

Node.propTypes = {
  item: PropTypes.object.isRequired,
}

function Row({ item, open, fresh, date, onToggle }) {
  const closed = item.kind === 'mission' && ['completed', 'failed', 'expired'].includes(item.mission.status) && !item.scheduled
  const classes = ['row', open && 'is-open', fresh && 'is-fresh', closed && 'is-closed'].filter(Boolean).join(' ')

  return (
    <li className={classes} id={`gm-${item.id}`}>
      <button type="button" className="row__button" aria-expanded={open} onClick={() => onToggle(item)}>
        <span className="row__time num">
          {item.at && campaignClock(item.at).hour}
          {item.scheduled && <span className="row__left">em {timeLeft(item.at, date)}</span>}
        </span>
        <Node item={item} />
        <span className="row__body">
          {fresh && <span className="row__fresh">Saiu agora</span>}
          {item.kind === 'mission'
            ? <MissionBody item={item} open={open} date={date} />
            : <MessageBody item={item} open={open} />}
        </span>
        {item.kind === 'mission' && <span className="row__value num">{formatBRL(item.mission.value)}</span>}
      </button>
    </li>
  )
}

Row.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  fresh: PropTypes.bool.isRequired,
  date: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
}

function Groups({ items, ...rowProps }) {
  const { openId, freshSince, date } = rowProps
  const isFresh = item => Boolean(freshSince && item.at && time(item.at) > time(freshSince) && time(item.at) <= time(date))

  return byDay(items).map(({ day, items: dayItems }) => (
    <div className="day" key={day}>
      <h3>{day}</h3>
      <ol>
        {dayItems.map(item => (
          <Row
            key={item.id}
            item={item}
            open={openId === item.id}
            fresh={isFresh(item)}
            date={date}
            onToggle={rowProps.onToggle}
          />
        ))}
      </ol>
    </div>
  ))
}

export function Timeline({ timeline, date, hunterName, openId, freshSince, showEarlier, onShowEarlier, onToggle }) {
  const earlier = [...timeline.origin, ...timeline.past]
  const hidden = showEarlier ? 0 : Math.max(0, earlier.length - EARLIER_SHOWN)
  const clock = campaignClock(date)
  const rowProps = { openId, freshSince, date, onToggle }

  return (
    <section css={timelineStyle} aria-label="Linha do tempo">
      {hidden > 0 && (
        <button type="button" className="button secondary timeline__earlier" onClick={onShowEarlier}>
          Mostrar {hidden} {hidden === 1 ? 'anterior' : 'anteriores'}
        </button>
      )}
      {earlier.length === 0
        ? <p className="timeline__empty">Nada publicado até agora.</p>
        : <Groups items={earlier.slice(hidden)} {...rowProps} />}

      <div className="now">
        <p className="now__line">
          <span className="now__label">Agora</span>
          <span>{clock.day} · <span className="num">{clock.hour}</span></span>
        </p>
        <p className="now__hint">
          {hunterName ?? 'Os jogadores'} {hunterName ? 'vê' : 'veem'} o que está acima.
          O que está abaixo entra quando a data da campanha avançar.
        </p>
      </div>

      {timeline.upcoming.length === 0
        ? <p className="timeline__empty">Nada agendado depois de agora.</p>
        : <Groups items={timeline.upcoming} {...rowProps} />}
    </section>
  )
}

Timeline.propTypes = {
  timeline: PropTypes.shape({
    origin: PropTypes.array.isRequired,
    past: PropTypes.array.isRequired,
    upcoming: PropTypes.array.isRequired,
  }).isRequired,
  date: PropTypes.string.isRequired,
  hunterName: PropTypes.string,
  openId: PropTypes.string,
  freshSince: PropTypes.string,
  showEarlier: PropTypes.bool.isRequired,
  onShowEarlier: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
}

const timelineStyle = css`
  --time: 52px;
  --node: 24px;
  --gap: 12px;
  --text-start: calc(var(--time) + var(--node) + var(--gap) * 2);

  @media (max-width: 599px) {
    --time: 40px;
    --node: 22px;
    --gap: 10px;
  }

  display: flex;
  flex-direction: column;
  gap: 20px;

  .timeline__earlier {
    align-self: flex-start;
    padding: 8px 14px;
    font-size: 13px;
  }

  .timeline__empty {
    padding-left: var(--text-start);
    font-size: 14px;
    color: var(--apagado);
  }

  .day {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  h3 {
    padding-left: var(--text-start);
    font-size: 12px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(var(--time) + var(--gap) + var(--node) / 2);
      width: 1px;
      background-color: var(--linha);
    }
  }

  .row__button {
    width: 100%;
    display: grid;
    grid-template-columns: var(--time) var(--node) minmax(0, 1fr) auto;
    column-gap: var(--gap);
    align-items: start;
    padding: 12px var(--gap) 12px 0;
    border-radius: 12px;
    background: none;
    color: var(--texto);
    text-align: left;
    font-weight: 400;
    transition: background-color 0.2s ease;
  }

  .row__button:hover,
  .is-open .row__button {
    background-color: var(--painel);
  }

  .is-fresh .row__button {
    animation: row-fresh 2.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes row-fresh {
    from { background-color: var(--laranja-fundo); }
  }

  .is-closed .row__title,
  .is-closed .row__value {
    color: var(--apagado);
  }

  .row__time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    padding-top: 1px;
    font-size: 13px;
    color: var(--apagado);
  }

  .row__left {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .node {
    position: relative;
    justify-self: center;
    width: 10px;
    height: 10px;
    margin-top: 5px;
    border-radius: 50%;
    background-color: var(--apagado);
    box-shadow: 0 0 0 4px var(--asfalto);
  }

  .node--available { background-color: var(--laranja); }
  .node--completed { background-color: var(--ok); }
  .node--failed { background-color: var(--perigo); }

  .node--in-progress {
    background-color: var(--asfalto);
    border: 2px solid var(--texto);
  }

  .node--scheduled {
    background-color: var(--asfalto);
    border: 1.5px dashed var(--apagado);
  }

  .node--message {
    width: 22px;
    height: 22px;
    margin-top: -1px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--painel-2);
    border: 1px solid var(--linha);
    color: var(--texto);

    svg {
      width: 12px;
      height: 12px;
    }
  }

  .node--message.node--scheduled {
    border: 1.5px dashed var(--apagado);
    background-color: var(--asfalto);
    color: var(--apagado);
  }

  .is-open .node,
  .row__button:hover .node {
    box-shadow: 0 0 0 4px var(--painel);
  }

  .row__body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .row__fresh {
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: 999px;
    background-color: var(--laranja-fundo);
    color: var(--laranja);
    font-size: 11px;
    font-weight: 600;
  }

  .row__title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
  }

  .row__to {
    color: var(--apagado);
    font-weight: 500;
  }

  .row__meta,
  .row__facts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--apagado);
  }

  .row__scheduled {
    font-weight: 600;
  }

  .row__text {
    font-size: 14px;
    line-height: 1.45;
    color: var(--texto);
    max-width: 62ch;
  }

  .row__text--short {
    color: var(--apagado);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row__more {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 6px;
  }

  .row__value {
    font-size: 14px;
    white-space: nowrap;
  }

  .now {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 0;
  }

  .now__line {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: var(--laranja);
    }
  }

  .now__label {
    padding: 4px 10px;
    border-radius: 999px;
    background-color: var(--laranja);
    color: #120700;
  }

  .now__hint {
    font-size: 12px;
    color: var(--apagado);
    line-height: 1.4;
  }

  @media (prefers-reduced-motion: reduce) {
    .is-fresh .row__button {
      animation: none;
    }
  }
`
