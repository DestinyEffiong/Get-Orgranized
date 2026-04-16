export interface Quote {
  text: string
  author: string
  category: 'organization' | 'productivity' | 'goals' | 'motivation' | 'focus'
}

export const quotes: Quote[] = [
  // Organization (6 quotes)
  {
    text: "For every minute spent organizing, an hour is earned.",
    author: "Benjamin Franklin",
    category: "organization"
  },
  {
    text: "A place for everything, and everything in its place.",
    author: "Benjamin Franklin",
    category: "organization"
  },
  {
    text: "Clutter is not just the stuff on your floor - it's anything that stands between you and the life you want to be living.",
    author: "Peter Walsh",
    category: "organization"
  },
  {
    text: "Organization isn't about perfection; it's about efficiency, reducing stress and clutter, saving time and money.",
    author: "Christina Scalise",
    category: "organization"
  },
  {
    text: "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks.",
    author: "Mark Twain",
    category: "organization"
  },
  {
    text: "Out of clutter, find simplicity. From discord, find harmony.",
    author: "Albert Einstein",
    category: "organization"
  },

  // Productivity (6 quotes)
  {
    text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: "Stephen Covey",
    category: "productivity"
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    category: "productivity"
  },
  {
    text: "Until we can manage time, we can manage nothing else.",
    author: "Peter Drucker",
    category: "productivity"
  },
  {
    text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
    category: "productivity"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "productivity"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "productivity"
  },

  // Goals (6 quotes)
  {
    text: "A goal without a plan is just a wish.",
    author: "Antoine de Saint-Exupéry",
    category: "goals"
  },
  {
    text: "Setting goals is the first step in turning the invisible into the visible.",
    author: "Tony Robbins",
    category: "goals"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis",
    category: "goals"
  },
  {
    text: "The trouble with not having a goal is that you can spend your life running up and down the field and never score.",
    author: "Bill Copeland",
    category: "goals"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "goals"
  },
  {
    text: "A year from now you may wish you had started today.",
    author: "Karen Lamb",
    category: "goals"
  },

  // Motivation (6 quotes)
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "motivation"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "motivation"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "motivation"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "motivation"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
    category: "motivation"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown",
    category: "motivation"
  },

  // Focus (6 quotes)
  {
    text: "It's not always that we need to do more but rather that we need to focus on less.",
    author: "Nathan W. Morris",
    category: "focus"
  },
  {
    text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.",
    author: "Alexander Graham Bell",
    category: "focus"
  },
  {
    text: "The successful warrior is the average man, with laser-like focus.",
    author: "Bruce Lee",
    category: "focus"
  },
  {
    text: "Where focus goes, energy flows.",
    author: "Tony Robbins",
    category: "focus"
  },
  {
    text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.",
    author: "Zig Ziglar",
    category: "focus"
  },
  {
    text: "The shorter way to do many things is to only do one thing at a time.",
    author: "Mozart",
    category: "focus"
  }
]

/**
 * Get a random quote from the collection
 */
export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  return quotes[randomIndex]
}

/**
 * Get a random quote by category
 */
export const getRandomQuoteByCategory = (category: Quote['category']): Quote => {
  const categoryQuotes = quotes.filter(q => q.category === category)
  const randomIndex = Math.floor(Math.random() * categoryQuotes.length)
  return categoryQuotes[randomIndex]
}
