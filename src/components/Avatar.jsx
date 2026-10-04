/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')
}

export function Avatar({ person, size = 48, className }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const showImage = person.avatar && person.avatar !== failedUrl

  return (
    <span css={avatar(size)} className={className}>
      {showImage
        ? <img src={person.avatar} alt="" onError={() => setFailedUrl(person.avatar)} />
        : initials(person.name)}
    </span>
  )
}

Avatar.propTypes = {
  person: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
}

const avatar = (size) => css`
  width: ${size}px;
  height: ${size}px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #333;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${Math.round(size / 3)}px;
  font-weight: 700;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`
