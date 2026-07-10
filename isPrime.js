/**
 * Check whether a number is prime.
 * @param {number} n - The number to test.
 * @returns {boolean} True if n is a prime number, false otherwise.
 */
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  if (n % 3 === 0) return n === 3;

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

module.exports = isPrime;

if (require.main === module) {
  const primes = [];
  for (let i = 0; i <= 20; i++) {
    if (isPrime(i)) primes.push(i);
  }
  console.log("Primes up to 20:", primes.join(", "));
}
