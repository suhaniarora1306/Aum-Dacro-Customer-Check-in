
export async function firestoreCallWithTimeout<T>(
  call: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Firestore operation timed out. Please check your connection."));
    }, timeoutMs);
  });

  return Promise.race([call(), timeoutPromise]);
}
