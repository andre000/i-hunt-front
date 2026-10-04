/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FireIcon, MapPinIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { formatBRL } from '../utils/format'

export function FeaturedMission({ data, onClick }) {
  return (
    <div className="mission" css={featuredMission} onClick={onClick}>
        <div className="mission__title">
        <div className="mission__title__group">
          <i className="mission__icon">
            <FireIcon />
          </i>
          <h3 className="mission__name">
            {data.name}
            <span className="mission__risk">{data.risk}</span>
          </h3>
        </div>
        <BookmarkIcon />
      </div>
      <div className="mission__tags">
        {data.tags.map(tag => (
          <span key={tag} className="mission__tag">{tag}</span>
        ))}
      </div>
      <div className="mission__details">
        <div className="mission__details__location">
          <MapPinIcon />
          <span>{data.location}</span>
        </div>
        <div className="mission__details__value">
          <span>{formatBRL(data.value)}</span>
        </div>
      </div>
    </div>
  )
}

FeaturedMission.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    risk: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    location: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

const featuredMission = css`
  background-color: #eee;
  color: #333;
  padding: 24px;
  border-radius: 32px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  svg {
    width: 21px;
    height: 21px;
  }

  .mission__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .mission__icon {
    background-color: #fff;
    color: #333;
    padding: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .mission__title__group {
    display: flex;
    align-items: center;
  }

  .mission__name {
    font-size: 20px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
  }

  .mission__risk {
    font-size: 12px;
    font-weight: 400;
    color: #666;
    margin-top: -4px;
  }

  .mission__tags {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 10px;
    font-weight: 400;
    text-transform: uppercase;
    flex-wrap: wrap;
  }

  .mission__tag {
    color: #666;
    background-color: #fff;
    padding: 4px 8px;
    border-radius: 16px;
  }

  .mission__details {
    display: flex;
    justify-content: space-between;
  }

  .mission__details__location {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 400;
    font-size: 14px;
  }

  .mission__details__value {
    border-radius: 16px;
    font-size: 18px;
    font-weight: 700;
  }
`
