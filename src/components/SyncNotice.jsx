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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 4px 16px;
  background-color: #333;
  color: #fff;
  font-size: 12px;
  text-align: center;
`
