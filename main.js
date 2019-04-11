"use strict"

const numberKeys = [...document.querySelectorAll('.num')]
const funcKeys = [...document.querySelectorAll('.op')];
const bracketKeys = [...document.querySelectorAll('.bracket')];
const equalBtn = document.querySelector('#eq');
const deleteBtn = document.querySelector('#delete');
const clearBtn = document.querySelector('#c');
const clearAllBtn = document.querySelector('#ac');


class Operation {
  constructor(f, str, precedence) {
    this.f = f;
    this.str = str;
    this.precedence = precedence;
  }

  toString(arg) {
    if (typeof this.str == 'function') {
      return this.str(arg);
    }
    return `${arg} ${this.str}`;
  }
}

const functions = {
  '+': new Operation((a, b) => a + b, `+ `, 0),
  '-': new Operation((a, b) => a - b, `- `, 0),
  '*': new Operation((a, b) => a * b, `* `, 1),
  '/': new Operation((a, b) => a / b, `/ `, 1),
  'Q': new Operation((a) => a * a, (arg) => `${arg}² `, 4),
  'r': new Operation((a) => Math.sqrt(a), (arg) => `√${arg} `, 4),
  '%': new Operation((a, b) => (b / 100) * a, '% ', 2),
  'E': new Operation((a, b) => a * Math.pow(10, b), 'e+ ', 3),
  'n': new Operation((a) => -1 * a, (arg) => `-(${arg})`, 4),
  'N': new Operation((a) => a * Math.log(a), (arg) => `ln(${arg}) `, 4),
  'L': new Operation((a) => a * Math.log10(a), (arg) => `log(${arg}) `, 4),
  'M': new Operation((a, b) => a % b, 'mod ', 2),
  's': new Operation((a) => Math.sin(a), (arg) => `sin(${arg}) `, 4),
  'c': new Operation((a) => Math.cos(a), (arg) => `cos(${arg}) `, 4),
  't': new Operation((a) => Math.tan(a), (arg) => `tan(${arg}) `, 4),
  'ctrl+S': new Operation((a) => Math.asin(a), (arg) => `sin⁻¹(${arg}) `, 4),
  'ctrl+C': new Operation((a) => Math.acos(a), (arg) => `cos⁻¹(${arg}) `, 4),
  'ctrl+T': new Operation((a) => Math.atan(a), (arg) => `tan⁻¹(${arg}) `, 4),
  'S': new Operation((a) => Math.sinh(a), (arg) => `sinh(${arg}) `, 4),
  'C': new Operation((a) => Math.cosh(a), (arg) => `cosh(${arg}) `, 4),
  'T': new Operation((a) => Math.tanh(a), (arg) => `tanh(${arg}) `, 4),
  'p': new Operation((a, b) => Math.pow(a, b), '^', 3),
  'i': new Operation((a) => 1 / a, (arg) => `1/${arg} `, 4),
  '!': new Operation((a) => {
    if ([0, 1].includes(a)) return 1;
    let fact = 1;
    for (let i = a; i > 1; i--) {
      fact *= i;
    }
    return fact;
  }, (arg) => `${arg}! `, 4),
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
    onClick(key, e => display.result = { num: e.target.dataset.key }));
}

function addFuncListeners() {
  funcKeys.forEach(key => onClick(key, e =>operate(e.target.dataset.key)));
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

  display.add(funcObj, result);
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
          const func = functions[this.stack[i]].f;
          const range = func.length + 1; // Number of places it takes on the this.stack
          const notEnoughArgs = i == index && !this.stack[i + func.length];

          if (notEnoughArgs) break;

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
      return functions[op1].precedence - functions[op2].precedence > 0;
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
    caretInfo: {},
    
    get result() { return this._result.num },

    set result({num = '0', update }) {
      if(!this._result) this._result = { num: num, update: update || true };
      if (num == '.' && this._result.num.includes('.')) return;

      const needsUpdate = update || this._result.update || false;
      this._result = { num: needsUpdate ? num : this._result.num + num, update: update || false };
      this.updateScreen();
    },

    add(funcObj, res) {
      const previousArity = this.caretInfo.f ? this.caretInfo.f.length : -1;
      const arity = funcObj.f.length;

      this.operations = previousArity == 1
        ? arity == 1 ? this.wrapLast(funcObj) : this.append(funcObj, '')
        : this.append(funcObj, this.result); 

      this.result = { num: res, update: true };
    },

    wrapLast(funcObj) {
      const newStr = funcObj.toString(`(${this.operations.slice(this.caretInfo.index)})`);
      return `${this.operations.slice(0, this.caretInfo.index)}${newStr}`;
    },

    append(funcObj, str) {
      this.caretInfo = {
        f: funcObj.f,
        index: this.operations.length && this.operations.length - 1 
      };

       return this.operations + funcObj.toString(str);
    },

    resolve(resolver) {
      if (!this.caretInfo.f) return;
      if (this.caretInfo.f.length == 2 &&
        display.operations.slice(-1) != ')') this.operations += `${+this.result}`;

      display.operations += ' = ';
      this.result = { num: resolver(+this.result) , update: true };
    },

    openBracket() {
      this.operations += ' (';
      this.clear();
    },

    closeBracket(arg, res) {
      this.operations += ` ${+arg} )`;
      this.result = { num: res, update: true };
    },

    clear() {
      this.result = { update: true };
    },

    deleteOne() {
      const newNum =  this.result.slice(0, -1) || '0';
      this._result.update = true; // Ensures old string is removed
      this.result = { num: newNum, update: this.result.length <= 1 };
    },

    reset() {
      [this.operations, this.result, this.caretInfo] = ['', {update: true}, {}];
    },

    updateScreen() {
      this.resultElem.textContent = this.result;
      this.operationsElem.textContent = this.operations;
    }
  }
}