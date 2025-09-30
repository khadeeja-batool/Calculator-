const display = document.getElementById('display');
const miniHistory = document.getElementById('miniHistory');
const fullHistory = document.getElementById('fullHistory');
const historyPanel = document.getElementById('historyPanel');

let justCalculated = false;
let lastExpression = null;
let history = [];

// Append number/operator
function append(value) {
  if (justCalculated && /[0-9.]/.test(value)) {
    display.textContent = value;
    justCalculated = false;
    return;
  }
  if (justCalculated && /[+\-*/%]/.test(value)) {
    justCalculated = false;
  }

  const currentNum = display.textContent.split(/[\+\-\*\/%]/).pop();
  if (value === '.' && currentNum.includes('.')) return;

  if (/[+\-*/%]$/.test(display.textContent) && /[+\-*/%]/.test(value)) {
    display.textContent = display.textContent.slice(0, -1) + value;
    return;
  }

  if (display.textContent === '0' && value !== '.') {
    display.textContent = value;
  } else {
    display.textContent += value;
  }
}

function clearAll() {
  display.textContent = '0';
  miniHistory.innerHTML = '';
  fullHistory.innerHTML = '';
  history = [];
  justCalculated = false;
  lastExpression = null;
}

function deleteChar() {
  if (display.textContent.length > 1) {
    display.textContent = display.textContent.slice(0, -1);
  } else {
    display.textContent = '0';
  }
}

// --- Percent handling ---
function evaluateWithPercent(expr) {
  let tokens = expr.match(/(\d+(\.\d+)?%?|\+|\-|\*|\/|\(|\))/g);
  if (!tokens) return NaN;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes('%')) {
      let num = parseFloat(tokens[i].replace('%', ''));
      let prevOp = (i > 0) ? tokens[i - 1] : null;

      if (prevOp === '+' || prevOp === '-') {
        let base = null;
        for (let j = i - 2; j >= 0; j--) {
          if (!isNaN(tokens[j])) {
            base = parseFloat(tokens[j]);
            break;
          }
        }
        if (base !== null) {
          tokens[i] = (base * num / 100).toString();
        } else {
          tokens[i] = (num / 100).toString();
        }
      } else {
        tokens[i] = (num / 100).toString();
      }
    }
  }

  let safeExpr = tokens.join('');
  return Function(`"use strict"; return (${safeExpr})`)();
}

// --- Calculate ---
function calculate() {
  try {
    let expression = display.textContent;

    // Prevent duplicate result if no operator
    if (justCalculated && !/[+\-*/%]/.test(expression)) return;

    if (/[+\-*/.%]$/.test(expression)) {
      expression = expression.slice(0, -1);
    }

    let result = evaluateWithPercent(expression);

    if (typeof result === "number" && !Number.isInteger(result)) {
      result = parseFloat(result.toPrecision(12));
    }

    // Save in history
    const historyItem = `${display.textContent} = ${result}`;
    history.push(historyItem);

    // Update mini history (last 4 only)
    miniHistory.innerHTML = history.slice(-4).join('<br>');

    // Update full history panel
    const item = document.createElement("div");
    item.textContent = historyItem;
    fullHistory.appendChild(item);

    display.textContent = result;
    justCalculated = true;
    lastExpression = expression;
  } catch {
    display.textContent = "Error";
    justCalculated = true;
  }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (/[0-9+\-*/.%]/.test(e.key)) append(e.key);
  else if (e.key === 'Enter') calculate();
  else if (e.key === 'Backspace') deleteChar();
  else if (e.key === 'Escape') clearAll();
});

// History Panel toggle
document.getElementById('toggleHistory').addEventListener('click', () => {
  document.getElementById('historyPanel').classList.toggle('show');
});
