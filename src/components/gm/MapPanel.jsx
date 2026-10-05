/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { Link } from '@tanstack/react-router'
import { MissionMap } from '../MissionMap'

const LEGEND = [
  ['available', 'Disponível'],
  ['in-progress', 'Em andamento'],
  ['completed', 'Concluída'],
  ['failed', 'Fracassada'],
  ['expired', 'Expirada'],
  ['scheduled', 'Agendada'],
]

export function MapPanel({ missions, selectedId, onSelect, editable = false }) {
  if (missions.length === 0) {
    return (
      <p css={mapPanel} className="map__empty">
        Nenhuma missão no mapa ainda. Marque o local de uma missão
        {editable ? <> no <Link to="/gm/editor">Editor</Link></> : ' no Editor (no computador)'} e ela aparece aqui.
      </p>
    )
  }

  return (
    <div css={mapPanel}>
      <MissionMap className="map__map" missions={missions} selectedId={selectedId} onSelect={onSelect} />
      <ul className="map__legend" aria-label="Legenda do mapa">
        {LEGEND.map(([status, label]) => (
          <li key={status}><span className={`map__key map__key--${status}`} aria-hidden="true" />{label}</li>
        ))}
      </ul>
    </div>
  )
}

MapPanel.propTypes = {
  missions: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  editable: PropTypes.bool,
}

const mapPanel = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;

  &.map__empty {
    display: block;
    flex: none;
    font-size: 13px;
    line-height: 1.45;
    color: var(--apagado);

    a {
      color: var(--laranja);
      text-underline-offset: 3px;
    }
  }

  .map__map {
    flex: 1;
    min-height: 240px;
    border-radius: 16px;
    border: 1px solid var(--linha);
    overflow: hidden;
    isolation: isolate;
  }

  .map__legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 12px;
    color: var(--apagado);

    li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }

  .map__key {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--apagado);
  }

  .map__key--available { background-color: var(--laranja); }
  .map__key--completed { background-color: var(--ok); }
  .map__key--failed { background-color: var(--perigo); }

  .map__key--in-progress {
    background-color: transparent;
    border: 2px solid var(--texto);
  }

  .map__key--scheduled {
    background-color: transparent;
    border: 1.5px dashed var(--apagado);
  }
`
