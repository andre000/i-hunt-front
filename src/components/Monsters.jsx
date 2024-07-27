import { useEffect } from 'react';
import MonsterDrawing from '../assets/drawings/monsters.svg?react';
import anime from 'animejs/lib/anime.es.js';

export function Monsters(props) {
  useEffect(() => {
    anime({
      targets: "g",
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1000,
      delay: anime.stagger(200, {start: 2000}),
      easing: 'easeInOutSine',
    })

    anime({
      targets: "g",
      translateY: function() {
        return anime.random(-10, 10);
      },
      translateX: function() {
        return anime.random(-10, 10);
      },
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine',
      duration: 2000,
    })
  })

  const handleClick = (e) => {
    const parentGroup = e.target.closest('g');
    if (!parentGroup) return;

    anime.timeline({
      targets: [...parentGroup.children].filter(c => c.classList.contains("cls-3")),
      duration: 500,
      easing: 'easeInOutSine',
      direction: 'alternate',
    }).add({
      fill: '#f60',
    }).add({
      targets: parentGroup.children,
      translateX: [
        { value: anime.random(-20,20), duration: 50 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 50 }
      ],
      translateY: [
        { value: anime.random(-20,20), duration: 50 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 100 },
        { value: anime.random(-20,20), duration: 50 }
      ],
      loop: 5,
    }, "-=250")
  }

  return <MonsterDrawing {...props} onClick={handleClick} />
}