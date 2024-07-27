/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react';
import PropTypes from 'prop-types'
import { css } from '@emotion/react'
import { ClockIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { ripple } from '../utils/ripple';

export function ClosingJob({ onClick }) {
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
    <div className="closing" css={closingJob} ref={closingRef} onClick={handleClick}>
      <div className="closing__icon">
        <ClockIcon />
      </div>

      <div className="closing__info">
        <h4>Caça vencendo</h4>
        <p>Boituva ● 3 dias</p>
      </div>

      <div className="closing__menu">
        <EllipsisVerticalIcon />
      </div>
    </div>
  )
}

ClosingJob.propTypes = {
  onClick: PropTypes.func.isRequired
}

const closingJob = css`
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

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