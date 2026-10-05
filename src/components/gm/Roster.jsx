/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { StarIcon } from '@heroicons/react/16/solid'
import { Avatar } from '../Avatar'
import { formatBRL } from '../../utils/format'

function HunterChips({ hunters, selectedId, onSelect }) {
  return (
    <section css={roster} aria-labelledby="gm-hunters">
      <h2 id="gm-hunters">Ver o que chega para</h2>
      <ul className="chips">
        <li>
          <button type="button" className="chip" aria-pressed={selectedId === null} onClick={() => onSelect(null)}>Todos</button>
        </li>
        {hunters.map(({ hunter }) => (
          <li key={hunter.id}>
            <button
              type="button"
              className="chip"
              aria-pressed={selectedId === hunter.id}
              onClick={() => onSelect(selectedId === hunter.id ? null : hunter.id)}
            >
              {hunter.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

HunterChips.propTypes = {
  hunters: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
}

export function HunterFilter({ hunters, selectedId, onSelect, compact = false }) {
  if (compact) return <HunterChips hunters={hunters} selectedId={selectedId} onSelect={onSelect} />

  return (
    <section css={roster} aria-labelledby="gm-hunters">
      <h2 id="gm-hunters">Hunters <span className="num">{hunters.length}</span></h2>
      <p className="roster__hint">Escolha um hunter para ver só o que chega para ele.</p>
      <ul>
        <li>
          <button type="button" className="roster__row roster__row--all" aria-pressed={selectedId === null} onClick={() => onSelect(null)}>
            <span className="roster__all" aria-hidden="true">{hunters.length}</span>
            <span className="roster__name">Todos</span>
          </button>
        </li>
        {hunters.map(({ hunter, earnings }) => (
          <li key={hunter.id}>
            <button
              type="button"
              className="roster__row"
              aria-pressed={selectedId === hunter.id}
              onClick={() => onSelect(selectedId === hunter.id ? null : hunter.id)}
            >
              <Avatar person={hunter} size={32} />
              <span className="roster__name">{hunter.name}</span>
              {hunter.rating === undefined
                ? <span className="roster__rating">sem nota</span>
                : (
                  <span className="roster__rating num">
                    <StarIcon aria-hidden="true" />
                    {hunter.rating.toFixed(1)}
                  </span>
                )}
              <span className="roster__value num">{formatBRL(earnings)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

HunterFilter.propTypes = {
  hunters: PropTypes.arrayOf(PropTypes.shape({
    hunter: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rating: PropTypes.number,
    }).isRequired,
    earnings: PropTypes.number.isRequired,
  })).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  compact: PropTypes.bool,
}

function messageCount(sent, scheduled) {
  const parts = [`${sent} ${sent === 1 ? 'enviada' : 'enviadas'}`]
  if (scheduled > 0) parts.push(`${scheduled} ${scheduled === 1 ? 'agendada' : 'agendadas'}`)
  return parts.join(' · ')
}

export function NpcList({ npcs }) {
  if (npcs.length === 0) return null

  return (
    <section css={roster} aria-labelledby="gm-npcs">
      <h2 id="gm-npcs">NPCs <span className="num">{npcs.length}</span></h2>
      <ul>
        {npcs.map(({ npc, sent, scheduled }) => (
          <li key={npc.id} className="roster__row roster__row--static">
            <Avatar person={npc} size={32} />
            <span className="roster__stack">
              <span className="roster__name">{npc.name}</span>
              <span className="roster__rating">{messageCount(sent, scheduled)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

NpcList.propTypes = {
  npcs: PropTypes.arrayOf(PropTypes.shape({
    npc: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }).isRequired,
    sent: PropTypes.number.isRequired,
    scheduled: PropTypes.number.isRequired,
  })).isRequired,
}

const roster = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
    display: flex;
    gap: 6px;
  }

  .roster__hint {
    font-size: 12px;
    color: var(--apagado);
    line-height: 1.4;
  }

  ul {
    list-style: none;
    margin: 0 -8px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .roster__row {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 12px;
    background: none;
    color: var(--texto);
    text-align: left;
    font-weight: 400;
  }

  button.roster__row:hover {
    background-color: var(--painel);
  }

  button.roster__row--all[aria-pressed='true'] {
    background-color: var(--painel);

    .roster__name {
      color: var(--texto);
    }
  }

  button.roster__row[aria-pressed='true']:not(.roster__row--all) {
    background-color: var(--laranja-fundo);

    .roster__name {
      color: var(--laranja);
    }
  }

  .roster__all {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px dashed var(--linha);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--apagado);
  }

  .roster__stack {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .chips {
    margin: 0 -16px;
    padding: 0 16px 2px;
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .chip {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    background-color: var(--painel-2);
    color: var(--apagado);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .chip[aria-pressed='true'] {
    background-color: var(--laranja-fundo);
    color: var(--laranja);
  }

  .roster__name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .roster__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--apagado);
    white-space: nowrap;

    svg {
      width: 12px;
      height: 12px;
      color: var(--aviso);
    }
  }

  .roster__value {
    text-align: right;
    font-size: 13px;
    white-space: nowrap;
  }
`
