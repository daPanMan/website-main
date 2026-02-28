'use strict';
let currScore1 = document.querySelector('#current--0');
let currScore2 = document.querySelector('#current--1');
let total1 = document.querySelector('#score--0');
let total2 = document.querySelector('#score--1');
let player1 = document.querySelector('.player--0');
let player2 = document.querySelector('.player--1');
let btnRenew = document.querySelector('.btn--new');
let btnRoll = document.querySelector('.btn--roll');
let btnHold = document.querySelector('.btn--hold');
let dice = document.querySelector('.dice');

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

function initialize() {
  player2.classList.remove('player--active');
  player1.classList.add('player--active');
  currScore1.textContent = 0;
  currScore2.textContent = 0;
  total1.textContent = 0;
  total2.textContent = 0;
  dice.classList.add('hidden');
}

function switchPlayer() {
  if (player1.classList.contains('player--active')) {
    total1.textContent =
      Number(total1.textContent) + Number(currScore1.textContent);
    currScore1.textContent = 0;
    player1.classList.remove('player--active');
    player2.classList.add('player--active');
  } else {
    total2.textContent =
      Number(total2.textContent) + Number(currScore2.textContent);
    currScore2.textContent = 0;
    player2.classList.remove('player--active');
    player1.classList.add('player--active');
  }
  checkVictory();
}

function turn(obj, droll) {
  dice.setAttribute('src', `dice-${droll}.png`);
  if (droll === 1) {
    switchPlayer();
  } else {
    obj.textContent = Number(obj.textContent) + droll;
  }
}

function checkVictory() {
  if (total1.textContent >= 100) {
    total1.textContent = '🥳';
    setTimeout(() => {
      initialize();
    }, 2000);
  } else if (total2.textContent >= 100) {
    total2.textContent = '🥳';
    setTimeout(() => {
      initialize();
    }, 2000);
  }
}

initialize();

btnRenew.addEventListener('click', initialize);
btnRoll.addEventListener('click', function () {
  dice.classList.remove('hidden');
  let droll = Math.trunc(Math.random() * 6 + 1);
  if (player1.classList.contains('player--active')) {
    turn(currScore1, droll);
  } else {
    turn(currScore2, droll);
  }
  checkVictory();
});

btnHold.addEventListener('click', switchPlayer);
