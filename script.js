const display = document.getElementById('display');
const history = document.getElementById('history');
let justCalculated = false; // track if last action was "="

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

  // Prevent multiple decimals in current number
  const currentNum = display.textContent.split(/[\+\-\*\/%]/).pop();
  if (value === '.' && currentNum.includes('.')) return;

  // Prevent consecutive operators
  if (/[+\-*/%]$/.test(display.textContent) && /[+\-*/%]/.test(value)) {
    display.textContent = display.textContent.slice(0, -1) + value;
    return;
  }

  // Replace leading zero
  if (display.textContent === '0' && value !== '.') {
    display.textContent = value;
  } else {
    display.textContent += value;
  }
}

// Clear all
function clearAll() {
  display.textContent = '0';
  history.innerHTML = ''; // clear full history
  justCalculated = false;
}

// Delete last char
function deleteChar() {
  if (display.textContent.length > 1) {
    display.textContent = display.textContent.slice(0, -1);
  } else {
    display.textContent = '0';
  }
}

// --- Helper: evaluate with proper % handling ---
function evaluateWithPercent(expr) {
  // Tokenize numbers and operators
  let tokens = expr.match(/(\d+(\.\d+)?%?|\+|\-|\*|\/|\(|\))/g);
  if (!tokens) return NaN;

  // Pass 1: Convert all % into decimal equivalents
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes('%')) {
      let num = parseFloat(tokens[i].replace('%', ''));
      // Check previous operator
      let prevOp = (i > 0) ? tokens[i - 1] : null;
      let prevNum = (i > 1 && !isNaN(tokens[i - 1])) ? parseFloat(tokens[i - 1]) : null;

      if (prevOp === '+' || prevOp === '-') {
        // relative percent (e.g. 200+10% => 200+(200*10/100))
        // Find the number before +/-
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
        // simple percent (e.g. 10% => 0.1, 100*10% => 100*(10/100))
        tokens[i] = (num / 100).toString();
      }
    }
  }

  // Rejoin and evaluate safely
  let safeExpr = tokens.join('');
  return Function(`"use strict"; return (${safeExpr})`)();
}

// Evaluate expression safely
function calculate() {
  try {
    let expression = display.textContent;

    // Remove trailing operator
    if (/[+\-*/.%]$/.test(expression)) {
      expression = expression.slice(0, -1);
    }

    let result = evaluateWithPercent(expression);

    // Handle large numbers (format)
    if (typeof result === "number" && !Number.isInteger(result)) {
      result = parseFloat(result.toPrecision(12));
    }

    // Append to history
    const historyItem = document.createElement("div");
    historyItem.textContent = display.textContent + " = " + result;
    history.appendChild(historyItem);

    // Update display
    display.textContent = result;
    justCalculated = true;
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
