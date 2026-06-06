export const getUsernameFromEmail = (email: string): string => {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    return email; // Return the whole email if "@" is not found
  }
  return email.substring(0, atIndex);
}