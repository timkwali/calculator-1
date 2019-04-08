"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const brackets = [...document.querySelectorAll('.bracket')];
const screen = document.querySelector('.main-display');
const opDisplay = document.querySelector('.operations-display');
const equal = document.querySelector('#eq');
const clear = document.querySelector('#c');
const clearAll = document.querySelector('#ac');
const precedence = ['+-', '*/', 'q'];

let display = '';
let stack = createStack();
let needArg = true;
let isNewArg = true;

addListeners();

function addListeners() {
  addNumberListeners();
  addFuncListeners();
  addBracketListeners();
  addEqListeners();
  addKeyboardShortcuts();
  addClearListeners();
}

function addClearListeners() {
  onClick(clear, () => clean());
  onClick(clearAll, () => resetState());
}

function addEqListeners() {
  onClick(equal, () => {
    display = stack.solve(+display);
    updateScreen();
  });
}

function addBracketListeners() {
  brackets.forEach(bracket => onClick(bracket, e => {
    if (e.target.dataset.key == '(') {
      stack.newContext();
      clean();
    } else {
      isNewArg = true;
      display = stack.closeContext(+display);
      updateScreen();
    }
  }));
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
  display = parseOp(op).length == 1 ? parseOp(op)(+display) :
    stack.execute(stack.insert(op, +display));

  isNewArg = true;
  updateScreen();
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

function updateScreen() {
  screen.textContent = display;
}

function clean() {
  display = '0';
  isNewArg = true;
  updateScreen();
}

function resetState() {
  stack = createStack();
  clean();
}

function newArg(num) {
  display = isNewArg ? num : display + num;

  isNewArg = false;
  updateScreen();
}

function onClick(elem, func) {
  elem.addEventListener('click', func);
}

function createStack() {
  return {
    contexts: [
      []
    ],

    get stack() {
      return this.contexts.slice(-1)[0];
    },

    execute: function (index) {
      for (let i = this.stack.length - 1; i >= index; i--) {
        if (isNaN(this.stack[i])) { // Checks for operands
          let func = parseOp(this.stack[i]);
          let range = func.length + 1; // Number of places it takes on the this.stack

          if (i == index && !this.stack[i + func.length]) break;

          this.stack.splice(i, range,
            func(...this.stack.slice(i + 1, i + range)));
        }
      }
      return this.stack.slice(-1)[0];
    },

    insert: function (op, arg) {
      const index = this.findStackIndex(op);
      this.stack.splice(index, 0, op);
      this.stack.push(arg);

      return index;
    },

    findStackIndex: function (op) {
      let index = this.stack.length;

      for (let i = this.stack.length - 1; i >= 0; i--) {
        if (isNaN(this.stack[i])) { // Checks for operands
          if (this.precedes(op, this.stack[i])) break;
          index = i;
        }
      }

      return index;
    },

    solve: function (arg) {
      this.stack.push(arg);
      return this.execute(0);
    },

    precedes: function (op1, op2) {
      return this.getPrecedence(op1) - this.getPrecedence(op2) > 0;
    },

    getPrecedence: function (op) {
      return precedence.findIndex(el => el.includes(op));
    },

    newContext: function () {
      this.contexts.push([]);
    },

    closeContext: function (arg) {
      const result = this.solve(arg);
      this.contexts.pop();
      return result;
    }
  };
}