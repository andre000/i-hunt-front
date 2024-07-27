/** @jsxImportSource @emotion/react */
import { useEffect } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { css } from '@emotion/react'
import anime from 'animejs/lib/anime.es.js';
import Logo from '../../components/Logo'
import { Monsters } from '../../components/Monsters';

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

function Login () {
  useEffect(() => {
    anime({
      targets: ".login h1, .login .button",
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
      delay: anime.stagger(1000, {start: 2000}),
      easing: 'easeInOutSine',
    });
  })

  const navigate = useNavigate()
  const handleClick = (e) => {
    e.preventDefault()
    anime.timeline({
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
    .finished.then(() => navigate({ to: '/', state: { referer: 'login' }}))
  }

  return <main css={body} className='login'>
    <header>
      <Logo enableAnimation />
    </header>
    
      <h1>{randomSlogan}</h1>

      <Monsters className="login__monsters" />

      <a onClick={handleClick} className='button secondary' to="/">
        <span className='login__enter'></span>
        Entrar
      </a>
    </main>
}

export const Route = createLazyFileRoute('/login/')({
  component: Login,
})

const body = css`
  height: 100vh;
  color: #777;
  font-weight: 300;
  overflow: hidden;
  padding: 16px;
  position: relative;
  max-width: 100vw;

  h1 {
    font-size: 1.8rem;
    margin-top: 2rem;
    position: absolute;
    bottom: 100px;
    width: 70%;
    line-height: 1.2;
  }

  .button {
    position: absolute;
    bottom: 28px;
    width: calc(100% - 32px);
    font-weight: 700;
    height: 48px;
    display: flex;
    align-items: center;
  }

  .login__monsters {
    position: absolute;
    top: 20%;
    left: 0;
    scale: 1.5;
    transform: rotate(30deg);
    // z-index: -1;
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
    background-color: #333;
  }

  .button::before {
    content: '→';
    position: absolute;
    right: 16px;
  }
`
