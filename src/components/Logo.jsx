/** @jsxImportSource @emotion/react */
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { css } from '@emotion/react'
import anime from 'animejs/lib/anime.es.js';


export default function Logo({ size = "medium", enableAnimation = false }) {
  Logo.propTypes = {
    size: PropTypes.string,
    enableAnimation: PropTypes.bool,
  };
  
  useEffect(() => {
    if (enableAnimation) {
      anime({
        targets: '#logo-highlight',
        scale: [3000, 0],
        duration: 2000,
        easing: 'easeInOutSine',
      });
    }
  }, [enableAnimation]);

  return (
    <div css={logo}>
      <h3 className={size}>
        <span>
          { (enableAnimation) ? <span id="logo-highlight" /> : null }
          i
        </span>
        Hunt
      </h3>
    </div>
  )
}

const logo = css`
  font-weight: 700;
  color: #333;

  span {
    color: #f60;
    font-weight: 700;
    position: relative;
  }

  #logo-highlight {
    content: ' ';
    position: absolute;
    top: 14px;
    left: 4px;
    width: 1px;
    height: 1px;
    background-color: #f60;
    z-index: 100;
    border-radius: 50%;
  }

  h3.small {
    font-size: 1.5rem;
  }
  
  h3.medium {
    font-size: 2rem;
  }
  
  h3.large {
    font-size: 3rem;
  }
`