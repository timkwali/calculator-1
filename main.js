"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const bracketKeys = [...document.querySelectorAll('.bracket')];
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

const precedence = ['+-', '*/M', '%', 'pE', 'QrnNLsctctrl+tctrl+Cctrl+TSCTi!'];
const functions = {
  '+': new Operation((a, b) => a + b, `+ `),
  '-': new Operation((a, b) => a - b, `- `),
  '*': new Operation((a, b) => a * b, `* `),
  '/': new Operation((a, b) => a / b, `/ `),
  'Q': new Operation((a) => a * a, (arg) => `${arg}² `),
  'r': new Operation((a) => Math.sqrt(a), (arg) => `√${arg} `),
  '%': new Operation((a, b) => (b / 100) * a, '% '),
  'E': new Operation((a, b) => a * Math.pow(10, b), 'e+ '),
  'n': new Operation((a) => -1 * a, (arg) => `-(${arg})`),
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
    if ([0, 1].includes(a)) return 1;
    let fact = 1;
    for (let i = a; i > 1; i--) {
      fact *= i;
    }
    return fact;
  }, (arg) => `${arg}! `),
};

let display = createDisplay();
let stack = createStack();

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
  onClick(clearBtn, () => display.clear());
  onClick(clearAllBtn, () => resetState());
  onClick(deleteBtn, () => display.deleteOne());
}

function addEqListeners() {
  onClick(equalBtn, () => display.resolve(arg => stack.solve(+arg)));
}

function addBracketListeners() {
  bracketKeys.forEach(bracket => onClick(bracket, e => {
    if (e.target.dataset.key == '(') openBracket();
    else closeBracket();
  }));
}

function addNumberListeners() {
  numberKeys.forEach(key =>
    onClick(key, e => {
      if (display.finished) resetState();
      display.newArg(e.target.dataset.key)
    }));
}

function addFuncListeners() {
  funcKeys.forEach(key => onClick(key, e => {
    if (display.finished) resetState();
    operate(e.target.dataset.key)
  }));
}

function addKeyboardShortcuts() {
  document.querySelectorAll('.key').forEach(key => {
    document.addEventListener('keydown', e => {
      let press = e.ctrlKey ? `ctrl+${e.key}` : e.key;
      if (key.dataset.key == press) {
        document.activeElement.blur(); // Avoids clicking on outlined element on Enter
        key.click();
        key.classList.toggle('key-active', true);
        setTimeout(() => key.classList.toggle('key-active', false), 100);
      }
    });
  });
}

function onClick(elem, func) {
  elem.addEventListener('click', func);
}

function openBracket() {
  stack.newContext();
  display.openBracket();
}

function closeBracket() {
  display.closeBracket(display.result, stack.closeContext(+display.result));
}

function operate(op) {
  const funcObj = functions[op];
  const result = funcObj.f.length == 1 ? funcObj.f(+display.result) :
    stack.execute(stack.insert(op, +display.result));

  display.add(funcObj, op, result);
}

function resetState() {

  stack = createStack();
  display.reset();
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
      this.stack.push(+arg);
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

function createDisplay() {
  return {
    resultElem: document.querySelector('.main-display'),
    operationsElem: document.querySelector('.operations-display'),
    operations: '',
    result: '0',
    isNewArg: true,
    finished: false,
    lastCall: {},

    add(funcObj, op, res) {
      if (this.lastCall.f && this.lastCall.f.length == 1 && funcObj.f.length == 1) {
        const newStr = funcObj.toString(`(${this.operations.slice(this.lastCall.index)})`);
        this.operations = `${this.operations.slice(0, this.lastCall.index)}${newStr}`;
      } else {
        const previousArity = this.lastCall.f ? this.lastCall.f.length : -1;
        this.lastCall = {
          f: funcObj.f,
          index: this.operations.length && this.operations.length - 1,
          op: op
        };

        this.operations += previousArity == 1 && funcObj.f.length == 2 
          ? funcObj.toString('') : funcObj.toString(this.result);
      }

      this.result = res;
      this.isNewArg = true;
      this.updateScreen();
    },

    resolve(resolver) {
      if (this.finished) resetState();
      if (!this.lastCall.f) return;
      if (this.lastCall.f.length == 2 &&
        display.operations.slice(-1) != ')') this.operations += `${+this.result}`;

      display.operations += ' =';
      this.result = resolver(+this.result);
      this.updateScreen();
      this.finished = true;
    },

    openBracket() {
      this.operations += ' (';
      this.clear();
    },

    closeBracket(arg, res) {
      this.isNewArg = true;
      this.operations += ` ${+arg} )`;
      this.result = res;
      this.updateScreen();
    },

    newArg(num) {
      if (num == '.' && this.result.includes('.')) return;
      this.result = this.isNewArg ? num : this.result + num;

      this.isNewArg = false;
      this.updateScreen();
    },

    clear() {
      this.result = '0';
      this.isNewArg = true;
      this.updateScreen();
    },

    deleteOne() {
      if (this.result.length > 1) {
        this.result = this.result.slice(0, -1);
      } else {
        this.result = 0;
        this.isNewArg = true;
      }
      this.updateScreen();
    },

    reset() {
      [this.operations, this.result, this.lastCall, this.isNewArg, this.finished] = ['', 0, {}, true, false];
      this.updateScreen();
    },

    updateScreen() {
      this.resultElem.textContent = this.result;
      this.operationsElem.textContent = this.operations;
    }
  }
}