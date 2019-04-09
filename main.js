"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const bracketKeys = [...document.querySelectorAll('.bracket')];
const screen = document.querySelector('.main-display');
const opDisplayBtn = document.querySelector('.operations-display');
const equalBtn = document.querySelector('#eq');
const clearBtn = document.querySelector('#c');
const clearAllBtn = document.querySelector('#ac');


class Operation {
  constructor(f, str) {
    this.f = f;
    this.str = str;
  }

  toString(arg) {
    if (typeof this.str == 'function') {
      return this.str(arg);
    }
    return `${arg} ${this.str}`;
  }
}

const precedence = ['+-', '*/', 'q'];
const functions = {
  '+': new Operation((a, b) => a + b, `+`),
  '-': new Operation((a, b) => a - b, `-`),
  '*': new Operation((a, b) => a * b, `*`),
  '/': new Operation((a, b) => a / b, `/`),
  'q': new Operation((a) => a * a, (arg) => `${arg}²`),
};

let display = '';
let opDisplay = '';
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
  addModeSelectorListeners();
}

function addModeSelectorListeners() {
  const basic = document.querySelector('#basic-mode');
  const scientific = document.querySelector('#scientific-mode');

  onClick(basic, () => {
    document.querySelector('.scientific').style.display = 'none';
    document.querySelector('.display').style.width = '498px';
  });

  onClick(scientific, () => {
    document.querySelector('.scientific').style.display = 'grid';
    document.querySelector('.display').style.width = '95%';
  });
}

function addClearListeners() {
  onClick(clearBtn, () => clear());
  onClick(clearAllBtn, () => resetState());
}

function addEqListeners() {
  onClick(equalBtn, () => {
    opDisplay += ` ${+display}`;
    display = stack.solve(+display);
    updateScreen();
  });
}

function addBracketListeners() {
  bracketKeys.forEach(bracket => onClick(bracket, e => {
    if (e.target.dataset.key == '(') {
      stack.newContext();
      opDisplay += ' (';
      clear();
    } else {
      isNewArg = true;
      opDisplay += ` ${+display} )`;
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

function operate(op) {
  const func = functions[op].f;

  opDisplay += functions[op].toString(+display);
  
  display = func.length == 1 ? func(+display) :
    stack.execute(stack.insert(op, +display));


  isNewArg = true;
  updateScreen();
}

function updateScreen() {
  screen.textContent = display;
  opDisplayBtn.textContent = opDisplay;
}

function clear() {
  display = '0';
  isNewArg = true;
  updateScreen();
}

function resetState() {
  stack = createStack();
  clear();
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
          let func = functions[this.stack[i]].f;
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