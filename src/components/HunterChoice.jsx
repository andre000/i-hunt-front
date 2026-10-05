/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import anime from 'animejs/lib/anime.es.js';
import Logo from './Logo'
import { Monsters } from './Monsters';
import { chooseHunter } from '../store/campaign'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const sloganArray = [
  "Monstros à solta? Seu bico agora é caçá-los!",
  "Transforme medo em renda com #iHunt.",
  "Acabe com os monstros e com suas contas!",
  "Cace monstros. Pague boletos. Viva melhor.",
  "Seu novo trabalho? Ser um herói urbano!",
  "O bico mais assustador e lucrativo da cidade.",
  "Caçar monstros nunca foi tão rentável!",
  "Monstros à vista? Faça dinheiro com isso!",
  "Salve o mundo e seu orçamento com #iHunt.",
];

const randomSlogan = sloganArray[Math.floor(Math.random() * sloganArray.length)];

function revealChoices() {
  anime({
    targets: ".login h1, .login .button",
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 1000,
    delay: anime.stagger(1000, {start: 2000}),
    easing: 'easeInOutSine',
  });
}

function playEnterTransition() {
  return anime.timeline({
    duration: 1000,
    easing: 'easeInOutSine',
  })
  .add({
    targets: ".login__enter",
    width: "100%",
    height: "100%",
    opacity: [0, 1],
    duration: 200,
    endDelay: 200,
    translateX: ["-50%", "-50%"],
    translateY: ["-50%", "-50%"],
  })
  .add({
    targets: ".login__enter",
    scale: [1, 500],
  })
  .finished
}

export function HunterChoice () {
  const hunters = useSelector(state => state.campaign.data.hunters)
  const dispatch = useDispatch()

  useEffect(revealChoices, [])

  const navigate = useNavigate()
  const handleChoose = (hunterId) => {
    playEnterTransition().then(() => {
      dispatch(chooseHunter(hunterId))
      navigate({ to: '/', state: { referer: 'login' }})
    })
  }

  return <main css={hunterChoice} className='login'>
    <header>
      <Logo enableAnimation />
    </header>

    <Monsters className="login__monsters" />

    <div className='login__bottom'>
      <h1>{randomSlogan}</h1>
      <p className='login__question'>Quem é você nesta campanha?</p>

      <ul className='login__hunters'>
        {hunters.map(hunter => (
          <li key={hunter.id}>
            <button type='button' onClick={() => handleChoose(hunter.id)} className='button secondary'>
              {hunter.name}
              <ArrowRightIcon className='login__arrow' aria-hidden='true' />
            </button>
          </li>
        ))}
      </ul>
    </div>

    <span className='login__enter'></span>
  </main>
}

const hunterChoice = css`
  min-height: 100dvh;
  color: var(--apagado);
  background-color: var(--asfalto);
  overflow: hidden;
  padding: 16px;
  position: relative;
  max-width: 100vw;
  display: flex;
  flex-direction: column;

  .login__bottom {
    margin-top: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 12px;
  }

  h1 {
    font-size: 2rem;
    width: 85%;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--texto);
  }

  .login__question {
    font-size: 14px;
  }

  .login__hunters {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .button {
    position: relative;
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    font-size: 16px;
  }

  .button:hover .login__arrow {
    color: var(--laranja);
  }

  .login__monsters {
    position: absolute;
    top: 20%;
    left: 0;
    scale: 1.5;
    transform: rotate(30deg);
    opacity: 0.1;
  }

  .login__enter {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 1px;
    border-radius: 12px;
    background-color: var(--asfalto);
    opacity: 0;
    pointer-events: none;
  }

  .login__arrow {
    position: absolute;
    right: 16px;
    width: 20px;
    height: 20px;
    color: var(--apagado);
  }
`
