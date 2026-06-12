export function getAvatarUrl(updatedAt: Date | string | null | undefined) {
  if (!updatedAt) return null;
  const time =
    updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  return `/api/user/avatar?t=${time}`;
}
