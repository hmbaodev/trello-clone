export const getUsernameFromEmail = (email: string): string => {
  if (!email) return "";
  const username = email.split("@")[0];
  return username;
}