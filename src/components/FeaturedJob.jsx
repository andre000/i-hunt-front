/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { FireIcon, MapPinIcon, BookmarkIcon } from '@heroicons/react/24/outline'

export function FeaturedJob() {
  return (
    <div className="job" css={featuredJob}>
      <div className="job__title">
        <div className="job__title__group">
          <i>
            <FireIcon />
          </i>
          <h3>
            Caça
            <span>Risco médio</span>
          </h3>
        </div>
        <BookmarkIcon />
      </div>
      <div className="job__tags">
        <span>Combate</span>
        <span>Caça</span>
      </div>
      <div className="job__details">
        <div className="job__details__location">
          <MapPinIcon />
          <span>São Paulo, SP</span>
        </div>
        <div className="job__details__value">
          <span>R$ 1.000,00</span>
        </div>
      </div>
    </div>
  )
}

const featuredJob = css`
  background-color: #eee;
  color: #333;
  padding: 24px;
  border-radius: 32px;
  font-size: 14px;
  font-weight: 700;

  svg {
    width: 21px;
    height: 21px;
  }

  .job {
    &__title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      i {
        background-color: #fff;
        color: #333;
        padding: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      &__group {
        display: flex;
        align-items: center;

        h3 {
          font-size: 20px;
          font-weight: 700;
          display: flex;
          flex-direction: column;

          span {
            font-size: 12px;
            font-weight: 400;
            color: #666;
            margin-top: -4px;
          }
        }
      }
    }

    &__tags {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 400;
      text-transform: uppercase;
      flex-wrap: wrap;
      
      span {
        color: #666;
        background-color: #fff;
        padding: 4px 8px;
        border-radius: 16px;
      }
    }

    &__details {
      display: flex;
      justify-content: space-between;

      &__location {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 400;
        font-size: 14px;
      }

      &__value {
        border-radius: 16px;
        font-weight: 800;
        font-size: 18px;
        font-weight: 700;
      }
    }
  }
`