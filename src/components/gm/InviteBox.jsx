/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { inviteLink } from '../../campaign/invite'

function fileName(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? url)
  } catch {
    return url
  }
}

export function InviteBox({ campaignUrl, playable }) {
  const inputRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const link = inviteLink(window.location.origin, campaignUrl)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      inputRef.current.select()
    }
  }

  return (
    <section css={invite} aria-labelledby="gm-invite">
      <h2 id="gm-invite">Convite</h2>
      <p>
        {playable
          ? <>Os jogadores entram pelo link de <code>{fileName(campaignUrl)}</code>.</>
          : 'Os jogadores não conseguem abrir a campanha agora. Corrija o JSON antes de mandar o Convite.'}
      </p>
      <div className="invite__row">
        <input ref={inputRef} readOnly value={link} aria-label="Convite da campanha" onFocus={e => e.target.select()} />
        <button type="button" className="button secondary" onClick={copy} disabled={!playable}>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </section>
  )
}

InviteBox.propTypes = {
  campaignUrl: PropTypes.string.isRequired,
  playable: PropTypes.bool.isRequired,
}

const invite = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
  }

  p {
    font-size: 12px;
    line-height: 1.4;
    color: var(--apagado);
  }

  code {
    font-family: var(--mono);
    color: var(--texto);
  }

  .invite__row {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--linha);
    border-radius: 12px;
    background-color: var(--painel);
    color: var(--apagado);
    font-family: var(--mono);
    font-size: 12px;
  }

  button {
    min-height: 44px;
    padding: 0 16px;
    font-size: 14px;
  }

  button:disabled {
    cursor: not-allowed;
    color: var(--apagado);
    background-color: var(--painel);
  }
`
