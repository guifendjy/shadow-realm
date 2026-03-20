// debounce
export default function debounce(cb, delay = 1000) {
  // 1000ms
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}
