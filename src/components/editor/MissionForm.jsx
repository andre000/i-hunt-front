import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { missionPreview, parseCoordinates } from '../../campaign/draft'
import { dateFromInput, dateToInput } from '../../campaign/draftDates'
import { MISSION_STATUS_LABEL, RISKS } from '../../campaign/missions'
import { itemRemoved, itemUpdated, missionPositioned } from '../../store/editor'
import { DeleteButton, DeleteItem } from './DeleteItem'
import { PositionPicker } from './PositionPicker'
import { HunterPicker } from './fields'

const RESULTS = [
  { value: '', label: 'Sem resultado' },
  { value: 'concluída', label: 'Concluída' },
  { value: 'fracassada', label: 'Fracassada' },
]

const optionalNumber = (value) => (value === '' ? undefined : Number(value))
const optionalList = (list) => (list.length > 0 ? list : undefined)
const tagsFrom = (text) => optionalList(text.split(',').map(tag => tag.trim()).filter(Boolean))

export function MissionBadge({ draft, index }) {
  const { status, scheduled } = missionPreview(draft, index)
  return scheduled
    ? <span className="editor__badge editor__badge--scheduled">Agendado</span>
    : <span className="editor__badge">{MISSION_STATUS_LABEL[status]}</span>
}

MissionBadge.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

function PositionField({ draft, index }) {
  const dispatch = useDispatch()
  const position = draft.missions[index].position
  const others = draft.missions.filter((_, at) => at !== index).map(mission => mission?.position).filter(Boolean)
  const setPosition = (value) => dispatch(missionPositioned({ index, position: value }))
  const setCoordinate = (key, value) => setPosition({ ...position, [key]: optionalNumber(value) })
  const pastePair = (e) => {
    const pair = parseCoordinates(e.clipboardData.getData('text'))
    if (!pair) return
    e.preventDefault()
    setPosition(pair)
  }

  return (
    <fieldset className="editor__position">
      <legend>Posição no mapa</legend>
      <PositionPicker position={position} others={others} onPick={setPosition} />
      <div className="editor__coordinates">
        <label>
          <span>Latitude</span>
          <input type="number" step="any" value={position?.lat ?? ''} onPaste={pastePair} onChange={e => setCoordinate('lat', e.target.value)} />
        </label>
        <label>
          <span>Longitude</span>
          <input type="number" step="any" value={position?.lng ?? ''} onPaste={pastePair} onChange={e => setCoordinate('lng', e.target.value)} />
        </label>
        <button type="button" className="button secondary" disabled={!position} onClick={() => setPosition(null)}>Tirar posição</button>
      </div>
      <p>Clique no mapa ou cole “latitude, longitude” do Google Maps.</p>
    </fieldset>
  )
}

PositionField.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

function MissionFields({ mission, onChange }) {
  return (
    <>
      <label>
        <span>Nome</span>
        <input required value={mission.name ?? ''} onChange={e => onChange({ name: e.target.value })} />
      </label>
      <div className="editor__row">
        <label>
          <span>Local</span>
          <input value={mission.location ?? ''} onChange={e => onChange({ location: e.target.value })} />
        </label>
        <label>
          <span>Valor (R$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={mission.value ?? ''}
            onChange={e => onChange({ value: optionalNumber(e.target.value) })}
          />
        </label>
        <label>
          <span>Risco</span>
          <select value={mission.risk ?? ''} onChange={e => onChange({ risk: e.target.value || undefined })}>
            {!RISKS.includes(mission.risk) && <option value="">Escolha</option>}
            {RISKS.map(risk => <option key={risk} value={risk}>{risk}</option>)}
          </select>
        </label>
      </div>
    </>
  )
}

MissionFields.propTypes = {
  mission: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export function MissionForm({ draft, index, onRemoved }) {
  const dispatch = useDispatch()
  const mission = draft.missions[index]
  const [tags, setTags] = useState(Array.isArray(mission.tags) ? mission.tags.join(', ') : '')
  const { status, scheduled } = missionPreview(draft, index)
  const campaignDate = draft.campaign.date
  const update = (changes) => dispatch(itemUpdated({ section: 'missions', index, changes }))
  const remove = () => {
    onRemoved()
    dispatch(itemRemoved({ section: 'missions', index }))
  }

  return (
    <form className="editor__form" onSubmit={e => e.preventDefault()}>
      <h1>{mission.name || '(sem nome)'}</h1>
      <div className="editor__meta">
        <code className="editor__id">{mission.id}</code>
        <span className="editor__badge">{MISSION_STATUS_LABEL[status]}</span>
        {scheduled && <span className="editor__badge editor__badge--scheduled">Agendado</span>}
      </div>
      <MissionFields mission={mission} onChange={update} />
      <label>
        <span>Descrição</span>
        <textarea rows={4} value={mission.description ?? ''} onChange={e => update({ description: e.target.value || undefined })} />
      </label>
      <label>
        <span>Etiquetas (separadas por vírgula)</span>
        <input
          value={tags}
          onChange={e => {
            setTags(e.target.value)
            update({ tags: tagsFrom(e.target.value) })
          }}
        />
      </label>
      <label className="editor__check">
        <input type="checkbox" checked={mission.featured === true} onChange={e => update({ featured: e.target.checked || undefined })} />
        <span>Em destaque</span>
      </label>
      <div className="editor__row">
        <label>
          <span>Prazo</span>
          <input
            type="datetime-local"
            value={dateToInput(mission.deadline, campaignDate)}
            onChange={e => update({ deadline: dateFromInput(e.target.value, campaignDate) })}
          />
        </label>
        <label>
          <span>Publicação</span>
          <input
            type="datetime-local"
            value={dateToInput(mission.postedAt, campaignDate)}
            onChange={e => update({ postedAt: dateFromInput(e.target.value, campaignDate) })}
          />
        </label>
        <label>
          <span>Resultado</span>
          <select value={mission.result ?? ''} onChange={e => update({ result: e.target.value || undefined })}>
            {RESULTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <PositionField draft={draft} index={index} />
      <HunterPicker legend="Hunters na missão" hunters={draft.hunters} selected={mission.hunters} onChange={hunters => update({ hunters: optionalList(hunters) })} />
      <HunterPicker legend="Aparece como perto para" hunters={draft.hunters} selected={mission.nearHunters} onChange={nearHunters => update({ nearHunters: optionalList(nearHunters) })} />
      <DeleteButton label="Apagar missão">
        {close => <DeleteItem name={mission.name || 'esta missão'} onConfirm={remove} onCancel={close} />}
      </DeleteButton>
    </form>
  )
}

MissionForm.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

export function NewMissionForm({ onAdd }) {
  const [mission, setMission] = useState({ name: '', location: '', risk: 'baixo' })

  return (
    <form
      className="editor__form"
      onSubmit={e => {
        e.preventDefault()
        onAdd({ ...mission, name: mission.name.trim() })
      }}
    >
      <h1>Nova missão</h1>
      <MissionFields mission={mission} onChange={changes => setMission(current => ({ ...current, ...changes }))} />
      <div className="editor__actions">
        <button type="submit" className="button primary">Adicionar</button>
      </div>
    </form>
  )
}

NewMissionForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
}
