/**
 * Async Error Handler Wrapper (Course Topic: 57 - Error Handling Middleware)
 * Wraps asynchronous controller functions to forward any rejected promises to next(err).
 * Eliminates repetitive try-catch blocks in Express route handlers.
 * 
 * @param {Function} fn - Asynchronous route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
