// Simple calculator with a bug
function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function multiply(a, b) {
  return a * b
}

function divide(a, b) {
  // BUG: Missing zero division check
  return a / b
}

function calculate(operation, a, b) {
  switch(operation) {
    case 'add':
      return add(a, b)
    case 'subtract':
      return subtract(a, b)
    case 'multiply':
      return multiply(a, b)
    case 'divide':
      return divide(a, b)
    default:
      // BUG: Should throw error, not return undefined
      console.log('Unknown operation')
  }
}

// Test cases
console.log('5 + 3 =', calculate('add', 5, 3))
console.log('10 - 4 =', calculate('subtract', 10, 4))
console.log('6 * 7 =', calculate('multiply', 6, 7))
console.log('15 / 3 =', calculate('divide', 15, 3))
console.log('15 / 0 =', calculate('divide', 15, 0)) // Should handle this!
console.log('5 % 2 =', calculate('modulo', 5, 2)) // Should throw error
