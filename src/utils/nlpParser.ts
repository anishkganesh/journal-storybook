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

  // CRITICAL: Character must come FIRST and be very explicit
  if (characterDesc) {
    // Extract key physical features to emphasize
    const skinToneMatch = characterDesc.match(/(light|dark|pale|tan|brown|fair|olive|bronze)[\s-]?(?:skinned|skin|complexion)?/i)
    const hairMatch = characterDesc.match(/(blonde|brown|black|red|curly|straight|wavy|short|long|afro|braided|tousled)[\s-]?(?:hair)?/gi)
    const eyeMatch = characterDesc.match(/(blue|brown|green|hazel|bright|curious|wide)[\s-]?(?:eyes)?/i)
    const ageMatch = characterDesc.match(/(\d+)[\s-]?(?:year|years)[\s-]?old/i) || characterDesc.match(/(child|toddler|kid|boy|girl)/i)
    const clothingMatch = characterDesc.match(/(?:wearing|dressed in|t-shirt|shorts|shirt|pants|dress|featuring)[\s\w-]+/gi)

    parts.push(`IMPORTANT - MAINTAIN EXACT SAME CHARACTER IN ALL IMAGES: ${characterDesc}`)

    // Add redundant emphasis on key features
    const keyFeatures: string[] = []
    if (skinToneMatch) keyFeatures.push(`MUST have ${skinToneMatch[0]} skin tone`)
    if (hairMatch && hairMatch.length > 0) keyFeatures.push(`MUST have ${hairMatch.join(' ')} hair`)
    if (eyeMatch) keyFeatures.push(`MUST have ${eyeMatch[0]} eyes`)
    if (ageMatch) keyFeatures.push(`MUST be ${ageMatch[0]}`)
    if (clothingMatch && clothingMatch.length > 0) keyFeatures.push(`MUST wear ${clothingMatch.join(', ')}`)

    if (keyFeatures.length > 0) {
      parts.push(`CHARACTER CONSISTENCY CRITICAL: ${keyFeatures.join('. ')}. DO NOT change character's appearance, skin tone, hair, or clothing between images`)
    }
  }

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

  // Final consistency reminder
  parts.push('Child-friendly, engaging composition, suitable for children\'s storybook. CRITICAL: Keep the SAME character with identical physical features throughout')

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
