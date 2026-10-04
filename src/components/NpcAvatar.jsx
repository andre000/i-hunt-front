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

export function NpcAvatar({ npc, size = 48 }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const showImage = npc.avatar && npc.avatar !== failedUrl

  return (
    <span css={avatar(size)}>
      {showImage
        ? <img src={npc.avatar} alt="" onError={() => setFailedUrl(npc.avatar)} />
        : initials(npc.name)}
    </span>
  )
}

NpcAvatar.propTypes = {
  npc: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  size: PropTypes.number,
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
