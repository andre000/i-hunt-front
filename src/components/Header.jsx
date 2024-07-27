/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

export function Header (props) {
  return (
    <header {...props} css={header} >
      <div>
        <h3>Olá Hunter</h3>
        <span className="header__stars">
          4.5 <StarIcon fill="#fff" />
        </span>
      </div>
      <BellIcon className="bell" />
    </header>
  )
}

const header = css`
  padding: 24px;
  background-color: #f60;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header__stars {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-left: 8px;
    margin-top: 4px;
    opacity: 0.9;

    svg {
      height: 12px;
    }
  }

  h3 {
    font-weight: 700;
    font-family: 'Open Sans', sans-serif;
  }

  .bell {
    width: 32px;
    color: #f60;
    background-color: #fff;
    border-radius: 50%;
    padding: 4px;
  }
`