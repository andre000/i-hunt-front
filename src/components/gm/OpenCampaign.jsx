/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link } from '@tanstack/react-router'
import { readInvite } from '../../campaign/invite'
import { switchCampaign } from '../../store/campaign'

function campaignUrlFrom(text) {
  try {
    const url = new URL(text.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return readInvite(url.search) ?? url.href
  } catch {
    return null
  }
}

export function OpenCampaign({ editable }) {
  const dispatch = useDispatch()
  const [text, setText] = useState('')
  const [invalid, setInvalid] = useState(false)

  const open = (event) => {
    event.preventDefault()
    const url = campaignUrlFrom(text)
    setInvalid(!url)
    if (url) dispatch(switchCampaign(url))
  }

  return (
    <section css={openCampaign}>
      <h1>Abra sua campanha</h1>
      <p>Cole o link do arquivo JSON publicado, ou um Convite que você já mandou para a mesa.</p>
      <form onSubmit={open} noValidate>
        <label htmlFor="gm-campaign-url">Link da campanha</label>
        <div className="open__row">
          <input
            id="gm-campaign-url"
            type="url"
            inputMode="url"
            placeholder="https://…/campanha.json"
            value={text}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'gm-campaign-url-error' : undefined}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" className="button primary">Abrir</button>
        </div>
        {invalid && <p id="gm-campaign-url-error" className="open__error">Isso não parece um link. Ele começa com https://</p>}
      </form>
      <div className="open__example">
        <p>Quer ver como fica antes?</p>
        <button
          type="button"
          className="button secondary"
          onClick={() => dispatch(switchCampaign(`${window.location.origin}/exemplo-campanha.json`))}
        >
          Abrir a campanha de exemplo
        </button>
      </div>
      <section className="open__steps" aria-labelledby="gm-steps">
        <h2 id="gm-steps">Primeira campanha</h2>
        <ol>
          <li>
            <span>
              {editable
                ? <><Link to="/gm/editor">Monte a campanha no Editor</Link> e baixe o arquivo JSON.</>
                : 'Monte a campanha no Editor, no computador, e baixe o arquivo JSON.'}
            </span>
          </li>
          <li><span>Publique o arquivo num endereço público, como um bucket ou um gist.</span></li>
          <li><span>Cole o link aqui e mande o Convite para a mesa.</span></li>
        </ol>
      </section>
    </section>
  )
}

OpenCampaign.propTypes = {
  editable: PropTypes.bool.isRequired,
}

const openCampaign = css`
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  h1 {
    font-size: 30px;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  p {
    font-size: 15px;
    line-height: 1.45;
    color: var(--apagado);
  }

  a {
    color: var(--laranja);
    text-underline-offset: 3px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 13px;
    font-weight: 600;
  }

  .open__row {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    padding: 0 14px;
    border: 1px solid var(--linha);
    border-radius: 12px;
    background-color: var(--painel);
    color: var(--texto);
    font-family: var(--mono);
    font-size: 14px;
  }

  input::placeholder {
    color: var(--apagado);
  }

  input[aria-invalid='true'] {
    border-color: var(--perigo);
  }

  button {
    min-height: 48px;
  }

  .open__example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;

    .button {
      min-height: 44px;
      font-size: 14px;
    }
  }

  .open__steps {
    margin-top: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--linha);
    display: flex;
    flex-direction: column;
    gap: 12px;

    h2 {
      font-size: 13px;
      font-weight: 600;
      color: var(--apagado);
      letter-spacing: 0;
    }

    ol {
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: step;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    li {
      counter-increment: step;
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 12px;
      font-size: 14px;
      line-height: 1.45;
      color: var(--texto);

      &::before {
        content: counter(step);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid var(--linha);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--mono);
        font-size: 12px;
        color: var(--apagado);
      }
    }
  }

  .open__error {
    font-size: 13px;
    color: var(--perigo);
  }
`
