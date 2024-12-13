export function debounce(
  func: (...innerArgs: any[]) => Promise<any>,
  delay: number
) {
  let timeoutId: NodeJS.Timeout; // Stores the timeout ID

  return async function (...args: any[]) {
    if (timeoutId) {
      // Clear the previous timeout
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(async () => {
      return await func(...args);
    }, delay);
  };
}
