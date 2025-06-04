/** @jsxImportSource @emotion/react */
import PropTypes from 'prop-types'; 
import { useNavigate } from '@tanstack/react-router'
import { css } from '@emotion/react'
import { HomeIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon, UserIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconFull, MagnifyingGlassIcon as MagnifyingGlassIconFull, ChatBubbleLeftIcon as ChatBubbleLeftIconFull, UserIcon as UserIconFull} from '@heroicons/react/24/solid'

export function Footer ({ active, ...props}) {
  const navigate = useNavigate()

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
          <li onClick={() => handleFooterClick('chat')}>
            { active === 'chat' ? <ChatBubbleLeftIconFull fill='#f60'/> : <ChatBubbleLeftIcon /> }
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
  }
`