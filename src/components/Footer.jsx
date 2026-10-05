/** @jsxImportSource @emotion/react */
import PropTypes from 'prop-types';
import { Link } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { unreadTotal } from '../campaign/messages'
import { css } from '@emotion/react'
import { MapIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon, UserIcon } from '@heroicons/react/24/outline'

const TABS = [
  { id: 'home', to: '/', label: 'Mapa', Icon: MapIcon },
  { id: 'search', to: '/search', label: 'Caças', Icon: MagnifyingGlassIcon },
  { id: 'chat', to: '/chat', label: 'Mensagens', Icon: ChatBubbleLeftIcon },
  { id: 'profile', to: '/profile', label: 'Perfil', Icon: UserIcon },
]

export function Footer ({ active, ...props}) {
  const unread = useSelector(state => unreadTotal(state.campaign.data, state.campaign.hunterId, state.campaign.readMessageIds))

  return (
    <footer {...props} css={footer}>
      <nav aria-label="Navegação principal">
        <ul>
          {TABS.map(({ id, to, label, Icon }) => (
            <li key={id}>
              <Link to={to} aria-current={active === id ? 'page' : undefined}>
                <span className="footer__icon">
                  <Icon />
                  {id === 'chat' && unread > 0 && (
                    <span className="footer__badge num" aria-label={`${unread} mensagens não lidas`}>{unread}</span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}

Footer.propTypes = {
  active: PropTypes.string
};

const footer = css`
  flex-shrink: 0;
  background-color: var(--painel);
  border-top: 1px solid var(--linha);
  padding: 8px 4px calc(10px + env(safe-area-inset-bottom, 0px));
  position: relative;
  z-index: 5;

  ul {
    display: flex;
    justify-content: space-around;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 4px 10px;
    min-width: 64px;
    font-size: 11px;
    font-weight: 600;
    color: var(--apagado);
    text-decoration: none;
    border-radius: 10px;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--texto);
  }

  a[aria-current='page'] {
    color: var(--texto);
  }

  a[aria-current='page'] svg {
    color: var(--laranja);
  }

  .footer__icon {
    position: relative;
    display: flex;
  }

  svg {
    width: 24px;
    height: 24px;
  }

  .footer__badge {
    position: absolute;
    top: -5px;
    left: 15px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background-color: var(--laranja);
    color: #120700;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 2px var(--painel);
  }
`
