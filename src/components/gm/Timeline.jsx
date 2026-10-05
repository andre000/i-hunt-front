/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { Link } from '@tanstack/react-router'
import { ChatBubbleOvalLeftIcon } from '@heroicons/react/16/solid'
import { RiskChip, StatusLabel } from '../MissionTags'
import { addMinutes, campaignClock, time, timeLeft } from '../../campaign/time'
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

const NAMES_SHOWN = 2

function names(list, open = true) {
  if (open || list.length <= NAMES_SHOWN + 1) return list.join(', ')
  return `${list.slice(0, NAMES_SHOWN).join(', ')} +${list.length - NAMES_SHOWN}`
}

function MissionBody({ item, open, date, hunterName }) {
  const { mission, scheduled, nearNames, hunterLink } = item
  const left = mission.deadline ? timeLeft(mission.deadline, date) : null

  return (
    <>
      <span className="row__title">{mission.name}</span>
      {hunterLink && <span className="row__link">{hunterLink === 'with' ? 'com' : 'perto de'} {hunterName}</span>}
      <span className="row__meta">
        {scheduled ? <span className="row__scheduled">Agendada</span> : <StatusLabel status={mission.status} />}
        <span>{mission.location}</span>
        {mission.hunterNames.length > 0 && <span>com {names(mission.hunterNames, open)}</span>}
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
  hunterName: PropTypes.string,
}

function MessageBody({ item, open }) {
  const { npc, recipients, message } = item

  return (
    <>
      <span className="row__title">
        {npc?.name ?? message.npc} <span className="row__to">→ {recipients ? names(recipients, open) : 'Todos'}</span>
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

function Row({ item, open, fresh, freshLabel, date, hunterName, onToggle }) {
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
          {fresh && <span className="row__fresh">{freshLabel}</span>}
          {item.kind === 'mission'
            ? <MissionBody item={item} open={open} date={date} hunterName={hunterName} />
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
  freshLabel: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  hunterName: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
}

function freshTest(freshSince, date) {
  return item => Boolean(freshSince && item.at && time(item.at) > time(freshSince) && time(item.at) <= time(date))
}

function Groups({ items, ...rowProps }) {
  const { openId, freshSince, freshLabel, date, hunterName } = rowProps
  const isFresh = freshTest(freshSince, date)

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
            freshLabel={freshLabel}
            date={date}
            hunterName={hunterName}
            onToggle={rowProps.onToggle}
          />
        ))}
      </ol>
    </div>
  ))
}

function count(total, one, many) {
  return `${total} ${total === 1 ? one : many}`
}

function arrivals(items) {
  const missions = items.filter(item => item.kind === 'mission').length
  const messages = items.length - missions
  return [missions && count(missions, 'missão', 'missões'), messages && count(messages, 'mensagem', 'mensagens')]
    .filter(Boolean)
    .join(' e ')
}

function itemLabel(item) {
  if (item.kind === 'mission') return item.mission.name
  const to = item.recipients ? names(item.recipients, false) : 'Todos'
  return `${item.npc?.name ?? item.message.npc} → ${to}`
}

const MINUTE = 60 * 1000

function Scrub({ realDate, marks, span, minutes, onMove }) {
  const start = time(realDate)
  const at = clock => campaignClock(addMinutes(realDate, clock))
  const markMinutes = marks.map(mark => Math.round((time(mark) - start) / MINUTE))
  const shown = at(minutes)

  const jump = event => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowUp'
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowDown'
    if (!forward && !back) return
    event.preventDefault()
    const target = forward
      ? markMinutes.find(mark => mark > minutes) ?? span
      : [...markMinutes].reverse().find(mark => mark < minutes) ?? 0
    onMove(target)
  }

  return (
    <span className="scrub" style={{ '--fill': `${(minutes / span) * 100}%` }}>
      <span className="scrub__marks" aria-hidden="true">
        {markMinutes.map(mark => (
          <span key={mark} className={mark <= minutes ? 'is-reached' : undefined} style={{ '--at': mark / span }} />
        ))}
      </span>
      <input
        type="range"
        min={0}
        max={span}
        step={1}
        value={minutes}
        aria-label="Ensaiar a data da campanha"
        aria-valuetext={minutes === 0 ? 'Agora' : `${shown.day}, ${shown.hour}`}
        onKeyDown={jump}
        onChange={event => onMove(Number(event.target.value))}
      />
    </span>
  )
}

Scrub.propTypes = {
  realDate: PropTypes.string.isRequired,
  marks: PropTypes.arrayOf(PropTypes.string).isRequired,
  span: PropTypes.number.isRequired,
  minutes: PropTypes.number.isRequired,
  onMove: PropTypes.func.isRequired,
}

function NowBand({ date, next, fresh, hunterName, onReveal, rehearsal }) {
  const clock = campaignClock(date)
  const viewer = hunterName ? `${hunterName} vê` : 'Os jogadores veem'
  const rehearsing = rehearsal?.minutes > 0
  const classes = ['now', fresh.length > 0 && 'is-moved', rehearsing && 'is-rehearsal'].filter(Boolean).join(' ')
  const real = rehearsal && campaignClock(rehearsal.realDate)

  return (
    <div className={classes} id="gm-agora">
      <div className="now__rule">
        <span className="now__label"><span className="now__dot" aria-hidden="true" />{rehearsing ? 'Ensaio' : 'Agora'}</span>
        {rehearsal ? <Scrub {...rehearsal} /> : <span className="now__line" />}
      </div>
      <p className="now__clock">
        <span className="now__hour num">{clock.hour}</span>
        <span className="now__day">{clock.day}</span>
        {rehearsing && <span className="now__real">de verdade: {real.day} · <span className="num">{real.hour}</span></span>}
      </p>
      {fresh.length > 0 && (
        <p className="now__moved" role={rehearsing ? undefined : 'status'}>
          {rehearsing ? 'Até aqui, saem' : 'Acabou de sair'}: {arrivals(fresh)}.
        </p>
      )}
      {next && (
        <button type="button" className="now__next" onClick={() => onReveal(next)}>
          <span className="now__next-label">Próximo em {timeLeft(next.at, date)}</span> {itemLabel(next)}
        </button>
      )}
      {rehearsing
        ? (
          <p className="now__hint now__hint--rehearsal" role="status">
            Os jogadores ainda não veem isto.
            <button type="button" className="now__action" onClick={() => rehearsal.onMove(0)}>Voltar para agora</button>
          </p>
        )
        : (
          <p className="now__hint">
            {viewer} o que está acima.
            {rehearsal ? ' Arraste a bolinha na linha para ensaiar os próximos horários.' : ' O que está abaixo entra quando a data da campanha avançar.'}
          </p>
        )}
    </div>
  )
}

NowBand.propTypes = {
  date: PropTypes.string.isRequired,
  next: PropTypes.object,
  fresh: PropTypes.array.isRequired,
  hunterName: PropTypes.string,
  onReveal: PropTypes.func.isRequired,
  rehearsal: PropTypes.shape({
    realDate: PropTypes.string.isRequired,
    marks: PropTypes.arrayOf(PropTypes.string).isRequired,
    span: PropTypes.number.isRequired,
    minutes: PropTypes.number.isRequired,
    onMove: PropTypes.func.isRequired,
  }),
}

function EditorHint({ editable, children }) {
  return editable ? <Link to="/gm/editor">{children}</Link> : <>{children} (no computador)</>
}

EditorHint.propTypes = {
  editable: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
}

export function Timeline({ timeline, date, hunterName, openId, freshSince, showEarlier, onShowEarlier, onToggle, editable = false, rehearsal = null }) {
  const earlier = [...timeline.origin, ...timeline.past]
  const hidden = showEarlier ? 0 : Math.max(0, earlier.length - EARLIER_SHOWN)
  const freshLabel = rehearsal?.minutes > 0 ? 'Vai sair' : 'Saiu agora'
  const rowProps = { openId, freshSince, freshLabel, date, hunterName, onToggle }
  const fresh = timeline.past.filter(freshTest(freshSince, date))
  const reveal = item => {
    if (openId !== item.id) onToggle(item)
    document.getElementById(`gm-${item.id}`)?.scrollIntoView?.({ block: 'center' })
  }

  return (
    <section css={timelineStyle} aria-label="Linha do tempo">
      {hidden > 0 && (
        <button type="button" className="button secondary timeline__earlier" onClick={onShowEarlier}>
          Mostrar {hidden} {hidden === 1 ? 'anterior' : 'anteriores'}
        </button>
      )}
      {earlier.length === 0
        ? (
          <p className="timeline__empty">
            Nada publicado até agora. Missões e mensagens com horário antes de agora aparecem aqui,
            e os jogadores já conseguem vê-las.
          </p>
        )
        : <Groups items={earlier.slice(hidden)} {...rowProps} />}

      <NowBand
        date={date}
        next={timeline.upcoming[0] ?? null}
        fresh={fresh}
        hunterName={hunterName}
        onReveal={reveal}
        rehearsal={rehearsal}
      />

      {timeline.upcoming.length === 0 && rehearsal?.minutes > 0 && (
        <p className="timeline__empty">Nada agendado depois deste horário.</p>
      )}
      {timeline.upcoming.length === 0 && !(rehearsal?.minutes > 0) && (
        <p className="timeline__empty">
            Nada agendado. Para preparar a próxima cena, dê a uma missão ou mensagem um horário depois de agora
          no <EditorHint editable={editable}>Editor</EditorHint>.
        </p>
      )}
      {timeline.upcoming.length > 0 && (
        <div className="timeline__upcoming"><Groups items={timeline.upcoming} {...rowProps} /></div>
      )}
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
  editable: PropTypes.bool,
  rehearsal: PropTypes.object,
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
    max-width: 62ch;
    font-size: 14px;
    line-height: 1.45;
    color: var(--apagado);

    a {
      color: var(--laranja);
      text-underline-offset: 3px;
    }
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
    text-align: right;
    overflow-wrap: anywhere;
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

  .row__link {
    align-self: flex-start;
    order: -1;
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

  .timeline__upcoming {
    display: flex;
    flex-direction: column;
    gap: 20px;

    ol::before {
      background: none;
      border-left: 1px dashed var(--linha);
    }
  }

  .is-fresh .node::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid var(--laranja);
    opacity: 0;
    animation: node-arrive 1.4s cubic-bezier(0.16, 1, 0.3, 1) 3;
  }

  @keyframes node-arrive {
    from { transform: scale(0.6); opacity: 0.9; }
    to { transform: scale(1.8); opacity: 0; }
  }

  .now {
    margin: 12px 0 4px;
    padding-left: var(--text-start);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .now__rule {
    align-self: stretch;
    margin-left: calc(var(--text-start) * -1);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .now__line {
    flex: 1;
    height: 1px;
    background-color: var(--laranja);
  }

  .now__label {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    border-radius: 999px;
    background-color: var(--laranja);
    color: #120700;
    font-size: 13px;
    font-weight: 700;
  }

  .now__dot {
    position: relative;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: #120700;

    &::after {
      content: '';
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      background-color: #120700;
      opacity: 0;
    }
  }

  .is-moved .now__dot::after {
    animation: now-pulse 1.4s cubic-bezier(0.16, 1, 0.3, 1) 3;
  }

  @keyframes now-pulse {
    from { transform: scale(0.3); opacity: 0.45; }
    to { transform: scale(1); opacity: 0; }
  }

  .is-rehearsal .now__label {
    background-color: var(--asfalto);
    color: var(--laranja);
    box-shadow: inset 0 0 0 1.5px var(--laranja);
  }

  .is-rehearsal .now__dot {
    background-color: var(--laranja);
  }

  .scrub {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 32px;
  }

  .scrub__marks {
    position: absolute;
    inset: 0 9px;
    pointer-events: none;

    span {
      position: absolute;
      top: 50%;
      left: calc(var(--at) * 100%);
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: var(--apagado);
      transform: translate(-50%, -50%);
    }

    .is-reached {
      background-color: var(--laranja);
    }
  }

  input[type='range'] {
    position: relative;
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 32px;
    margin: 0;
    background: transparent;
    cursor: grab;
  }

  input[type='range']:active {
    cursor: grabbing;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background:
      linear-gradient(to right, var(--laranja) var(--fill), transparent var(--fill)),
      repeating-linear-gradient(to right, rgb(255 107 26 / 45%) 0 6px, transparent 6px 10px);
  }

  input[type='range']::-moz-range-track {
    height: 2px;
    background:
      linear-gradient(to right, var(--laranja) var(--fill), transparent var(--fill)),
      repeating-linear-gradient(to right, rgb(255 107 26 / 45%) 0 6px, transparent 6px 10px);
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    margin-top: -8px;
    border-radius: 50%;
    background-color: var(--laranja);
    box-shadow: 0 0 0 4px var(--asfalto);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 50%;
    background-color: var(--laranja);
    box-shadow: 0 0 0 4px var(--asfalto);
  }

  input[type='range']:hover::-webkit-slider-thumb,
  input[type='range']:active::-webkit-slider-thumb {
    transform: scale(1.15);
  }

  input[type='range']:focus-visible {
    outline: none;
  }

  input[type='range']:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 4px var(--asfalto), 0 0 0 6px var(--laranja);
  }

  input[type='range']:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 4px var(--asfalto), 0 0 0 6px var(--laranja);
  }

  .now__clock {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
  }

  .now__hour {
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
  }

  .now__day {
    font-size: 15px;
    font-weight: 600;
    color: var(--apagado);
  }

  .now__real {
    font-size: 12px;
    color: var(--apagado);
  }

  .now__moved {
    padding: 6px 12px;
    border-radius: 12px;
    background-color: var(--laranja-fundo);
    color: var(--laranja);
    font-size: 13px;
    font-weight: 600;
  }

  .is-moved .now__moved {
    animation: now-moved 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes now-moved {
    from { opacity: 0; transform: translateY(-6px); }
  }

  .now__next {
    margin-left: -10px;
    padding: 6px 10px;
    border-radius: 12px;
    background: none;
    color: var(--texto);
    text-align: left;
    font-size: 15px;
    font-weight: 600;
    transition: background-color 0.2s ease;
  }

  .now__next:hover {
    background-color: var(--painel);
  }

  .now__next-label {
    font-weight: 500;
    color: var(--apagado);
  }

  .now__hint {
    max-width: 62ch;
    font-size: 12px;
    line-height: 1.5;
    color: var(--apagado);
  }

  .now__hint--rehearsal {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 14px;
    font-size: 13px;
    color: var(--texto);
  }

  .now__action {
    padding: 4px 0;
    background: none;
    color: var(--laranja);
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .is-fresh .row__button,
    .is-fresh .node::after,
    .is-moved .now__dot::after,
    .is-moved .now__moved {
      animation: none;
    }
  }
`
