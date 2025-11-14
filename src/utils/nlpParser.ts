// Natural Language Parser for extracting style preferences and character descriptions

export interface ParsedPreferences {
  artStyles: string[]
  characters: string[]
  moods: string[]
  colors: string[]
  lighting: string[]
  rawText: string
}

const stylePatterns = {
  artStyles: [
    'anime', 'manga', 'watercolor', 'oil painting', 'sketch', 'digital art',
    'photorealistic', 'cartoon', 'comic book', 'pixel art', 'abstract',
    'minimalist', 'impressionist', 'surreal', 'cyberpunk', 'steampunk',
    'fantasy', 'sci-fi', 'vintage', 'retro', 'modern', 'studio ghibli',
    'pixar', '3d', 'storybook', 'pastel'
  ],
  characters: [
    'boy', 'girl', 'man', 'woman', 'child', 'person', 'character',
    'hero', 'warrior', 'wizard', 'knight', 'princess', 'prince',
    'kid', 'baby', 'toddler', 'teenager', 'adult'
  ],
  moods: [
    'happy', 'sad', 'angry', 'peaceful', 'dramatic', 'mysterious',
    'whimsical', 'dark', 'bright', 'melancholic', 'energetic', 'calm',
    'intense', 'serene', 'chaotic', 'ethereal', 'playful', 'serious',
    'magical', 'realistic'
  ],
  colors: [
    'vibrant', 'muted', 'pastel', 'dark', 'bright', 'warm', 'cool',
    'monochrome', 'colorful', 'black and white', 'sepia', 'neon',
    'soft', 'bold', 'subtle'
  ],
  lighting: [
    'dramatic lighting', 'soft lighting', 'golden hour', 'sunset',
    'sunrise', 'moonlight', 'neon', 'backlit', 'rim lighting',
    'natural light', 'studio lighting', 'candlelight'
  ]
}

export function parseNaturalLanguage(input: string): ParsedPreferences {
  const lowerInput = input.toLowerCase()
  const extracted: ParsedPreferences = {
    artStyles: [],
    characters: [],
    moods: [],
    colors: [],
    lighting: [],
    rawText: input
  }

  // Extract each category
  Object.keys(stylePatterns).forEach((category) => {
    const patterns = stylePatterns[category as keyof typeof stylePatterns]
    patterns.forEach((term) => {
      // Use word boundary for better matching
      const regex = new RegExp(`\\b${term}\\b`, 'i')
      if (regex.test(input)) {
        extracted[category as keyof Omit<ParsedPreferences, 'rawText'>].push(term)
      }
    })
  })

  return extracted
}

export function buildPromptFromParsed(
  baseStory: string,
  parsed: ParsedPreferences,
  characterDesc?: string
): string {
  const parts: string[] = []

  // Art style
  if (parsed.artStyles.length > 0) {
    const style = parsed.artStyles[0]
    if (style.includes('anime') || style.includes('manga')) {
      parts.push('Vibrant anime style illustration, Studio Ghibli inspired, soft pastel colors, expressive character design, whimsical and warm atmosphere')
    } else if (style.includes('watercolor')) {
      parts.push('Soft watercolor painting, gentle brushstrokes, pastel colors, dreamy children\'s book illustration, flowing and ethereal')
    } else if (style.includes('3d') || style.includes('pixar')) {
      parts.push('Cute 3D illustration, Pixar-style, rounded features, volumetric lighting, glossy cartoon rendering')
    } else {
      parts.push(`${style} style illustration`)
    }
  } else {
    // Default to storybook style
    parts.push('Classic children\'s storybook illustration, warm inviting colors, detailed but not cluttered, traditional book art')
  }

  // Character description
  if (characterDesc) {
    parts.push(`Main character: ${characterDesc}`)
  }

  // Base story/scene
  parts.push(`Scene: ${baseStory}`)

  // Mood/atmosphere
  if (parsed.moods.length > 0) {
    parts.push(`${parsed.moods[0]} atmosphere`)
  }

  // Lighting
  if (parsed.lighting.length > 0) {
    parts.push(parsed.lighting[0])
  }

  // Color palette
  if (parsed.colors.length > 0) {
    parts.push(`${parsed.colors[0]} color palette`)
  }

  // Consistency requirements
  parts.push('Consistency requirements: maintain exact same character appearance and features, use the same color palette and lighting style, child-friendly, engaging composition, suitable for children\'s storybook')

  return parts.join('. ')
}

// Extract character description from user input
export function extractCharacterHints(input: string): string {
  const hints: string[] = []

  // Look for character descriptors
  const characterRegex = /(boy|girl|man|woman|child|kid) (?:with |who (?:has|is) )(.+?)(?:\.|,|$)/gi
  let match

  while ((match = characterRegex.exec(input)) !== null) {
    hints.push(`${match[1]} ${match[2]}`)
  }

  return hints.join(', ')
}
