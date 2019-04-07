"use strict"

let display = '';
const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const screen = document.querySelector('.screen');

addNumberListeners();

function addNumberListeners() {
  numberKeys.forEach(key => {
    key.addEventListener('click', event => {
      display += event.target.dataset.key;
      updateScreen();
    });
  });
}

function updateScreen() {
  screen.textContent = display;
}

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  return a / b;
}

function operate(op, a, b) {
  const func = parseOp(op);

  return func(a, b);
}

function parseOp(op) {
  switch(op) {
    case '+':
      return add;
    case '-':
      return subtract;
    case '*':
      return multiply;
    case '/':
      return divide;
    default:
      throw new Error('Invalid input');
  }
}







