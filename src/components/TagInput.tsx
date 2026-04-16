/** @jsxImportSource theme-ui */
import { useState } from 'react'
import { X } from 'lucide-react'
import { PREDEFINED_TAGS, getTagColor } from '../data/tags'

interface TagInputProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  compact?: boolean
}

const TagInput = ({ selectedTags, onChange, compact }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('')

  const toggleTag = (label: string) => {
    const lower = label.toLowerCase()
    if (selectedTags.some(t => t.toLowerCase() === lower)) {
      onChange(selectedTags.filter(t => t.toLowerCase() !== lower))
    } else {
      onChange([...selectedTags, label])
    }
  }

  const addCustomTag = () => {
    const tag = inputValue.trim()
    if (!tag) return
    if (selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      setInputValue('')
      return
    }
    // Use predefined casing if it matches
    const predefined = PREDEFINED_TAGS.find(p => p.label.toLowerCase() === tag.toLowerCase())
    onChange([...selectedTags, predefined ? predefined.label : tag])
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCustomTag()
    }
  }

  return (
    <div>
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2
        }}>
          {selectedTags.map(tag => {
            const colors = getTagColor(tag)
            return (
              <span
                key={tag}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  px: 2,
                  py: '3px',
                  borderRadius: '14px',
                  fontSize: 0,
                  fontWeight: '600',
                  background: colors.bg,
                  color: colors.text,
                  border: '1px solid',
                  borderColor: colors.border
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  sx={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: colors.text,
                    opacity: 0.7,
                    ':hover': { opacity: 1 }
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Predefined tag chips (not shown in compact mode) */}
      {!compact && (
        <div sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2
        }}>
          {PREDEFINED_TAGS.map(({ label, colors }) => {
            const isSelected = selectedTags.some(t => t.toLowerCase() === label.toLowerCase())
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleTag(label)}
                sx={{
                  px: 2,
                  py: '3px',
                  borderRadius: '14px',
                  fontSize: 0,
                  fontWeight: '600',
                  border: '1px solid',
                  borderColor: isSelected ? colors.border : 'border',
                  background: isSelected ? colors.bg : 'surface',
                  color: isSelected ? colors.text : 'muted',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    borderColor: colors.border,
                    background: colors.bg,
                    color: colors.text
                  }
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Custom tag input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a tag and press Enter..."
        sx={{
          width: '100%',
          px: 3,
          py: compact ? 1 : 2,
          border: '1px solid',
          borderColor: 'border',
          borderRadius: compact ? '6px' : '8px',
          fontSize: compact ? 0 : 1,
          outline: 'none',
          transition: 'border-color 0.2s',
          ':focus': {
            borderColor: 'primary'
          }
        }}
      />
    </div>
  )
}

export default TagInput
