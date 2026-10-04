import { css } from '@emotion/react'

export const centeredScreen = css`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: #333;
`

export const rowButton = css`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  color: #333;
  text-align: left;
  cursor: pointer;
`

export const stackedText = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`
