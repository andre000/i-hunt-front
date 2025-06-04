/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function UnderMaintenance() {
  return (
    <div className="under-maintenance" css={underMaintenance}>
      <ExclamationTriangleIcon />
      <h1>Em manutenção</h1>
      <p>Estamos trabalhando para melhorar o sistema. Volte mais tarde.</p>
    </div>
  )
}

const underMaintenance = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 16px;
  color: #333;
  margin-top: 72px;

  svg {
    width: 132px;
    height: 132px;
    color: #f60;
  }

  p {
    font-size: 14px;
    color: #777;
  }
`