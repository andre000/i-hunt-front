/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react';
import PropTypes from 'prop-types'
import { css } from '@emotion/react'
import { MapPinIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { ripple } from '../utils/ripple';
import { MISSION_STATUS_LABEL } from '../campaign/missions';

export function NearbyMission({ onClick, data }) {
  const cardRef = useRef(null)
  const [disabled, setDisabled] = useState(false)

  const handleClick = (e) => {
    if (disabled) return;
    setDisabled(true)
    ripple(cardRef.current, e)
      .then(() => onClick())
      .finally(() => setDisabled(false))
  }

  return (
    <div className="nearby" css={nearbyMission} ref={cardRef} onClick={handleClick}>
      <div css={cardContent}>
        <div className="nearby__icon">
        <MapPinIcon className="nearby__glyph" />
      </div>

      <div className="nearby__info">
        <h4 className="nearby__name">{data.name}</h4>
        <p className="nearby__meta">{data.location} ● {MISSION_STATUS_LABEL[data.status]}</p>
      </div>

      <div className="nearby__menu">
        <EllipsisVerticalIcon className="nearby__glyph" />
      </div>
      </div>
    </div>
  )
}

NearbyMission.propTypes = {
  onClick: PropTypes.func.isRequired,
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(Object.keys(MISSION_STATUS_LABEL)).isRequired,
    location: PropTypes.string.isRequired
  }).isRequired
}

const cardContent = css`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`

const nearbyMission = css`
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 16px;
  display: flex;

  .nearby__icon {
    background-color: #eee;
    color: #fff;
    padding: 8px;
    border-radius: 50%;
  }

  .nearby__info {
    flex-grow: 1;
  }

  .nearby__name {
    line-height: 1;
  }

  .nearby__meta {
    color: #777;
    font-size: 12px;
  }

  .nearby__menu {
    color: #333;
  }

  .nearby__glyph {
    width: 24px;
    height: 24px;
    stroke: #333;
  }
`
