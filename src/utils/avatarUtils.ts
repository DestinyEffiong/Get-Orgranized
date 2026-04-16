// Avatar color generation utility
// Maps first letter of name to a color

export const AVATAR_COLORS = [
  { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
  { bg: '#EC4899', text: '#FFFFFF' }, // Pink
  { bg: '#EF4444', text: '#FFFFFF' }, // Red
  { bg: '#F59E0B', text: '#FFFFFF' }, // Orange
  { bg: '#10B981', text: '#FFFFFF' }, // Green
  { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
  { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
]

/**
 * Generates a consistent color for a given name
 * Uses the first letter to pick from the color palette
 */
export const getAvatarColor = (name: string): { bg: string; text: string } => {
  if (!name || name.length === 0) {
    return AVATAR_COLORS[0] // Default to blue
  }

  // Get first letter and convert to uppercase
  const firstLetter = name.charAt(0).toUpperCase()

  // Convert letter to number (A=0, B=1, etc.)
  const charCode = firstLetter.charCodeAt(0) - 65 // A=0

  // Map to color index (0-7)
  const colorIndex = charCode % AVATAR_COLORS.length

  return AVATAR_COLORS[Math.max(0, colorIndex)]
}

/**
 * Gets the initials from a name (first letter of first name)
 */
export const getInitials = (name: string): string => {
  if (!name || name.length === 0) {
    return '?'
  }

  return name.charAt(0).toUpperCase()
}
