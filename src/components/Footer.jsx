/** @jsxImportSource @emotion/react */
import PropTypes from 'prop-types'; 
import { useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { unreadTotal } from '../campaign/messages'
import { css } from '@emotion/react'
import { HomeIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon, UserIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconFull, MagnifyingGlassIcon as MagnifyingGlassIconFull, ChatBubbleLeftIcon as ChatBubbleLeftIconFull, UserIcon as UserIconFull} from '@heroicons/react/24/solid'

export function Footer ({ active, ...props}) {
  const navigate = useNavigate()
  const unread = useSelector(state => unreadTotal(state.campaign.data, state.campaign.hunterId, state.campaign.readMessageIds))

  function handleFooterClick(goTo) {
    if (active === goTo) return

    const to = goTo === 'home' ? '/' : `/${goTo}`
    navigate({ to })
  }

  return (
    <footer {...props} css={footer}>
      <nav>
        <ul>
          <li onClick={() => handleFooterClick('home')}>
            { active === 'home' ? <HomeIconFull fill='#f60'/> : <HomeIcon /> }
          </li>
          <li onClick={() => handleFooterClick('search')}>
            { active === 'search' ? <MagnifyingGlassIconFull fill='#f60'/> : <MagnifyingGlassIcon /> }
          </li>
          <li className='footer__chat' onClick={() => handleFooterClick('chat')}>
            { active === 'chat' ? <ChatBubbleLeftIconFull fill='#f60'/> : <ChatBubbleLeftIcon /> }
            {unread > 0 && <span className='footer__badge' aria-label={`${unread} mensagens não lidas`}>{unread}</span>}
          </li>
          <li onClick={() => handleFooterClick('profile')}>
            { active === 'profile' ? <UserIconFull fill='#f60'/> : <UserIcon /> }
          </li>
        </ul>
      </nav>
    </footer>
  )
} 

Footer.propTypes = {
  active: PropTypes.string.isRequired
};

const footer = css`
  position: fixed;
  bottom: 0px;
  left: 0;
  width: 100%;
  background-color: #fff;
  padding-block: 16px;
  box-shadow: 0 -1px 20px 0px rgb(0 0 0 / 5%);
  max-width: var(--max-width);
  left: calc(50% - var(--max-width) / 2);
  transition: transform 0.3s ease-in-out;

  @media (max-width: 440px) {
    transform: translateX(0);
    left: 0;
  }

  ul {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      height: 24px;
      width: 24px;
    }

    .footer__chat {
      position: relative;
    }

    .footer__badge {
      position: absolute;
      top: -6px;
      right: -10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background-color: #f60;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`