export interface TagColor {
  bg: string
  text: string
  border: string
}

export const PREDEFINED_TAGS: { label: string; colors: TagColor }[] = [
  { label: 'Work',     colors: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' } },
  { label: 'Personal', colors: { bg: '#FCE7F3', text: '#BE185D', border: '#EC4899' } },
  { label: 'Urgent',   colors: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' } },
  { label: 'Health',   colors: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' } },
  { label: 'Finance',  colors: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' } },
  { label: 'Learning', colors: { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' } },
  { label: 'Home',     colors: { bg: '#FDE68A', text: '#78350F', border: '#D97706' } },
  { label: 'Meeting',  colors: { bg: '#CFFAFE', text: '#155E75', border: '#06B6D4' } },
  { label: 'Ideas',    colors: { bg: '#F3E8FF', text: '#6B21A8', border: '#A855F7' } },
  { label: 'Errands',  colors: { bg: '#E5E7EB', text: '#374151', border: '#6B7280' } },
]

export const DEFAULT_TAG_COLOR: TagColor = { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }

export const getTagColor = (tagLabel: string): TagColor => {
  const predefined = PREDEFINED_TAGS.find(
    t => t.label.toLowerCase() === tagLabel.toLowerCase()
  )
  return predefined ? predefined.colors : DEFAULT_TAG_COLOR
}
