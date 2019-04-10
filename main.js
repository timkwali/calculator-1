"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const bracketKeys = [...document.querySelectorAll('.bracket')];
const screen = document.querySelector('.main-display');
const opDisplayBtn = document.querySelector('.operations-display');
const equalBtn = document.querySelector('#eq');
const deleteBtn = document.querySelector('#delete');
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

const precedence = ['+-', '*/M', '%','pE','Qrctrl+-NLsctctrl+tctrl+Cctrl+TSCTi!'];
const functions = {
  '+': new Operation((a, b) => a + b, `+ `),
  '-': new Operation((a, b) => a - b, `- `),
  '*': new Operation((a, b) => a * b, `* `),
  '/': new Operation((a, b) => a / b, `/ `),
  'Q': new Operation((a) => a * a, (arg) => `${arg}² `),
  'r': new Operation((a) => Math.sqrt(a), (arg) => `√${arg} `),
  '%': new Operation((a, b) => (b / 100) * a, '% '),
  'E': new Operation((a, b) => a * Math.pow(10, b),'e+ '),
  'ctrl+-': new Operation((a) => -1 * a, (arg) => `-(${arg})`),
  'N': new Operation((a) => a * Math.log(a), (arg) => `ln(${arg}) `),
  'L': new Operation((a) => a * Math.log10(a), (arg) => `log(${arg}) `),
  'M': new Operation((a, b) => a % b, 'mod '),
  's': new Operation((a) => Math.sin(a), (arg) => `sin(${arg}) `),
  'c': new Operation((a) => Math.cos(a), (arg) => `cos(${arg}) `),
  't': new Operation((a) => Math.tan(a), (arg) => `tan(${arg}) `),
  'ctrl+S': new Operation((a) => Math.asin(a), (arg) => `sin⁻¹(${arg}) `),
  'ctrl+C': new Operation((a) => Math.acos(a), (arg) => `cos⁻¹(${arg}) `),
  'ctrl+T': new Operation((a) => Math.atan(a), (arg) => `tan⁻¹(${arg}) `),
  'S': new Operation((a) => Math.sinh(a), (arg) => `sinh(${arg}) `),
  'C': new Operation((a) => Math.cosh(a), (arg) => `cosh(${arg}) `),
  'T': new Operation((a) => Math.tanh(a), (arg) => `tanh(${arg}) `),
  'p': new Operation((a, b) => Math.pow(a, b), '^'),  
  'i': new Operation((a) => 1 / a, (arg) => `1/${arg} `),
  '!': new Operation((a) => {
    if ([0,1].includes(a)) return 1;
    let fact = 1;
    for(let i=a; i > 1; i--) {
      fact *= i;
    }
    return fact;
      }, (arg) => `${arg}! `),
};

let display = '';
let opDisplay = '';
let stack = createStack();
let needArg = true;
let isNewArg = true;
let finished = false;
let lastCall = {};

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
  const basic = document.querySelector('.basic-mode');
  const scientific = document.querySelector('.scientific-mode');

  onClick(basic, () => {
    document.querySelector('.scientific').style.display = 'none';
    basic.classList.toggle('selected', true);
    scientific.classList.toggle('selected', false);
  });

  onClick(scientific, () => {
    document.querySelector('.scientific').style.display = 'grid';
    scientific.classList.toggle('selected', true);
    basic.classList.toggle('selected', false);
  });
}

function addClearListeners() {
  onClick(clearBtn, () => clear());
  onClick(clearAllBtn, () => resetState());
  onClick(deleteBtn, () => deleteOne());
}

function addEqListeners() {
  onClick(equalBtn, () => resolve());
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
    onClick(key, e => {
      if (finished) resetState();
      newArg(e.target.dataset.key)
    }));
}

function addFuncListeners() {
  funcKeys.forEach(key => onClick(key, e => {
    if (finished) resetState();
    operate(e.target.dataset.key)
  }));
}

function addKeyboardShortcuts() {
  document.querySelectorAll('.key').forEach(key => {
    document.addEventListener('keydown', e => {
      let press = e.ctrlKey ? `ctrl+${e.key}` : e.key;
      if (key.dataset.key == press) {
        key.click();
        key.classList.toggle('key-active', true);
        setTimeout(() => key.classList.toggle('key-active', false), 100);
      }
    });
  });
}

function operate(op) {
  const func = functions[op].f;
  
  if (lastCall.f && lastCall.f.length == 1 && func.length == 1) {
    const newStr = functions[op].toString(`(${opDisplay.slice(lastCall.index)})`);
    opDisplay = `${opDisplay.slice(0, lastCall.index)}${newStr}`;
  } else {
    lastCall = {f: func, index: opDisplay.length && opDisplay.length-1, op: op};
    opDisplay += functions[op].toString(+display);
  }

  
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
  opDisplay = '';
  finished = false;
  lastCall = {};
  clear();
}

function deleteOne() {
  if (display.length > 1) {
    display = display.slice(0, -1);
  } else {
    display = 0;
    isNewArg = true;
  }
  updateScreen();
}

function resolve() {
  if (finished) resetState();
  if (!lastCall.f) return;
  if (lastCall.f.length == 2) opDisplay += `${+display}`;
  
  display = stack.solve(+display);
  updateScreen();
  finished = true;
}

function newArg(num) {
  if (num == '.' && display.includes('.')) return;
  display = isNewArg ? num : display + num;

  isNewArg = false;
  updateScreen();
}

function onClick(elem, func) {
  elem.addEventListener('click',func);
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