"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const screen = document.querySelector('.screen');
const equal = document.querySelector('#eq');
const clear = document.querySelector('#clear');
const precedence = ['+-', '*/', 'q'];

let display = '';
let stack = [];
let needArg = true;
let isNewArg = true;

addNumberListeners();
addFuncListeners();
addEqListeners();
addKeyboardShortcuts();
addClearListeners();

function addClearListeners() {
  onClick(clear, () => resetState());
}

function addEqListeners() {
  onClick(equal, () => operate(null));
}

function addNumberListeners() {
  numberKeys.forEach(key =>
    onClick(key, e => newArg(e.target.dataset.key)));
}

function addFuncListeners() {
  funcKeys.forEach(key =>
    onClick(key, e => operate(e.target.dataset.key)));
}

function addKeyboardShortcuts() {
  document.querySelectorAll('.key').forEach(key => {
    document.addEventListener('keydown', e => {
      if (key.dataset.key.includes(e.key)) key.click();
    });
  });
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

function square(n) {
  return n * n;
}

function operate(op) {
  execute(insert(op));
  isNewArg = true;
}

function parseOp(op) {
  switch (op) {
    case '+':
      return add;
    case '-':
      return subtract;
    case '*':
      return multiply;
    case '/':
      return divide;
    case 'q':
      return square;
    default:
      throw new Error(`Invalid input: ${op}`);
  }
}

function execute(index) {
  needArg = true;
  for (let i = stack.length - 1; i >= index; i--) {
    if (isNaN(stack[i])) {
      let func = parseOp(stack[i]);
      let range = func.length + 1;

      if (i == index && range != 2) return;

      if (range == 2) needArg = false;

      stack.splice(i, range,
        func(...stack.slice(i + 1, i + range)));
    }
  }
}

function insert(op) {
  let index = findStackIndex(op);
  stack.splice(index, 0, op);
  if (needArg) stack.push(+display);

  return index;
}

function findStackIndex(op) {
  let prevOpIndex = stack.length;

  for (let i = stack.length - 1; i >= 0; i--) {
    if (isNaN(stack[i])) {
      if (compare(op, stack[i]) > 0) break;
      prevOpIndex = i;
    }
  }

  return prevOpIndex;
}

function compare(op1, op2) {
  return getPrecedence(op1) - getPrecedence(op2);
}

function getPrecedence(op) {
  return precedence.findIndex(el => el.includes(op));
}

function updateScreen() {
  screen.textContent = display;
}

function resetState() {

}

function newArg(num) {
  if (!needArg) {
    stack.pop();
    needArg = true;
  }

  display = isNewArg ? num : display + num;

  isNewArg = false;
  updateScreen();
}

function onClick(elem, func) {
  elem.addEventListener('click', func);
}