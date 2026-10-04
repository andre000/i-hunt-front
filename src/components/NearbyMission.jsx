/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react';
import PropTypes from 'prop-types'
import { css } from '@emotion/react'
import { MapPinIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { ripple } from '../utils/ripple';

export function NearbyMission({ onClick, data }) {
  const closingRef = useRef(null)
  const [disabled, setDisabled] = useState(false)

  const handleClick = (e) => {
    if (disabled) return;
    setDisabled(true)
    ripple(closingRef.current, e)
      .then(() => onClick())
      .finally(() => setDisabled(false))
  }

  return (
    <div className="closing" css={nearbyMission} ref={closingRef} onClick={handleClick}>
      <div css={closingContent}>
        <div className="closing__icon">
        <MapPinIcon />
      </div>

      <div className="closing__info">
        <h4>{data.name}</h4>
        <p>{data.location}</p>
      </div>

      <div className="closing__menu">
        <EllipsisVerticalIcon />
      </div>
      </div>
    </div>
  )
}

NearbyMission.propTypes = {
  onClick: PropTypes.func.isRequired,
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired
  }).isRequired
}

const closingContent = css`
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

  .closing {
    &__icon {
      background-color: #eee;
      color: #fff;
      padding: 8px;
      border-radius: 50%;

      svg {
        width: 24px;
        height: 24px;
        stroke: #333;
      }
    }

    &__info {
      flex-grow: 1;

      h4 {
        line-height: 1;
      }

      p {
        color: #777;
        font-size: 12px;
      }
    }

    &__menu {
      color: #333;
      
      svg {
        width: 24px;
        height: 24px;
        stroke: #333
      }
    }
  }
`