/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { useSelector } from 'react-redux'

export function SyncNotice() {
  const { offline, updateError } = useSelector(state => state.campaign)

  const message = offline
    ? 'Sem conexão. Mostrando a última versão salva.'
    : updateError
      ? 'Não foi possível atualizar a campanha.'
      : null

  if (!message) return null

  return <p role="status" css={syncNotice}>{message}</p>
}

const syncNotice = css`
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  padding: calc(6px + env(safe-area-inset-top, 0px)) 16px 6px;
  background-color: var(--aviso-fundo);
  color: var(--aviso);
  font-weight: 600;
  font-size: 12px;
  text-align: center;
`
