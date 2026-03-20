/**
 *
 * @param {Function} callback function to call when after throtlling
 * @param {Number} delay time to wait in ms.
 * @returns
 */
export default function throttle(callback, delay = 1000) {
  let shouldWait = false;
  let waitingArgs;

  const timeoutFunction = () => {
    if (waitingArgs === null) {
      shouldWait = false;
    } else {
      callback(...(waitingArgs || []));
      waitingArgs = null;
      setTimeout(timeoutFunction, delay);
    }
  };

  // the throttling function to run throttle.
  return (...args) => {
    if (shouldWait) {
      waitingArgs = args || [];
      return;
    }

    // if not waiting call immediately
    callback(...args);
    shouldWait = true;

    // wait
    setTimeout(timeoutFunction, delay);
  };
}
