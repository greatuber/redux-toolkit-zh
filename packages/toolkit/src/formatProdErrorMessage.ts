/**
 * Adapted from React: https://github.com/facebook/react/blob/master/packages/shared/formatProdErrorMessage.js
 *
 * Do not require this module directly! Use normal throw error calls. These messages will be replaced with error codes
 * during build.
 * @param {number} code
 */
export function formatProdErrorMessage(code: number) {
  return (
    `Minified Redux Toolkit error #${code}; visit https://ouweiya.github.io/redux-toolkit-zh/Errors?code=${code} for the full message or ` +
    'use the non-minified dev environment for full errors. '
  )
}
