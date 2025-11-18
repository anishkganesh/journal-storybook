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
  characterDesc?: string,
  imageIndex?: number,
  totalImages?: number
): string {
  const parts: string[] = []

  // ULTRA-CRITICAL: Character consistency with extreme detail
  if (characterDesc) {
    // Extract EVERY physical detail for maximum consistency
    const skinToneMatch = characterDesc.match(/(light|dark|pale|tan|brown|fair|olive|bronze|beige|peachy|warm|cool)[\s-]?(?:skinned|skin|complexion|tone)?/gi)
    const hairColorMatch = characterDesc.match(/(blonde|brown|black|red|auburn|chestnut|dark|light|golden|sandy)[\s-]?(?:hair)?/gi)
    const hairStyleMatch = characterDesc.match(/(curly|straight|wavy|short|long|afro|braided|tousled|messy|neat|spiky|fluffy|bouncy)[\s-]?(?:hair)?/gi)
    const eyeColorMatch = characterDesc.match(/(blue|brown|green|hazel|amber|gray|dark)[\s-]?(?:eyes?|eyed)?/gi)
    const eyeDescMatch = characterDesc.match(/(bright|curious|wide|large|round|expressive|sparkly|shining)[\s-]?(?:eyes)?/gi)
    const ageMatch = characterDesc.match(/(\d+)[\s-]?(?:year|years)[\s-]?old/i) || characterDesc.match(/(young child|child|toddler|kid|boy|girl)/i)
    const clothingMatch = characterDesc.match(/(?:wearing|dressed in|t-shirt|shorts|shirt|pants|dress|vest|jacket|featuring|colorful)[\s\w-]+/gi)
    const facialMatch = characterDesc.match(/(freckles|dimples|round face|cheeks|smile|grin|tooth|teeth|button nose|small nose)/gi)

    // Build EXTREMELY detailed character specification
    const detailedFeatures: string[] = []

    // Skin tone - be VERY specific
    if (skinToneMatch && skinToneMatch.length > 0) {
      detailedFeatures.push(`EXACT skin tone: ${skinToneMatch.join(' ')} - NO variation allowed`)
    }

    // Hair - color AND style must match
    const hairDetails: string[] = []
    if (hairColorMatch && hairColorMatch.length > 0) hairDetails.push(hairColorMatch.join(' '))
    if (hairStyleMatch && hairStyleMatch.length > 0) hairDetails.push(hairStyleMatch.join(' '))
    if (hairDetails.length > 0) {
      detailedFeatures.push(`EXACT hair: ${hairDetails.join(' ')} hair - same color, same style, same volume in EVERY image`)
    }

    // Eyes - color AND expression
    const eyeDetails: string[] = []
    if (eyeColorMatch && eyeColorMatch.length > 0) eyeDetails.push(eyeColorMatch.join(' '))
    if (eyeDescMatch && eyeDescMatch.length > 0) eyeDetails.push(eyeDescMatch.join(' '))
    if (eyeDetails.length > 0) {
      detailedFeatures.push(`EXACT eyes: ${eyeDetails.join(' ')} eyes - same color, same size, same shape`)
    }

    // Age
    if (ageMatch) {
      detailedFeatures.push(`EXACT age: ${ageMatch[0]} - same proportions and maturity level`)
    }

    // Clothing
    if (clothingMatch && clothingMatch.length > 0) {
      detailedFeatures.push(`EXACT outfit: ${clothingMatch.join(', ')} - identical clothing in every scene`)
    }

    // Facial features
    if (facialMatch && facialMatch.length > 0) {
      detailedFeatures.push(`EXACT facial features: ${facialMatch.join(', ')} - must appear identically`)
    }

    // FIRST LINE: Complete character description
    parts.push(`[IMAGE ${imageIndex || 1} OF ${totalImages || 4}] SAME CHARACTER AS ALL OTHER IMAGES: ${characterDesc}`)

    // SECOND LINE: Extracted detailed features
    if (detailedFeatures.length > 0) {
      parts.push(`MANDATORY CONSISTENCY - ${detailedFeatures.join(' | ')} | This is the SAME person in all ${totalImages || 4} images`)
    }

    // THIRD LINE: Absolute prohibitions
    parts.push(`PROHIBITED: Changing skin color, hair color, hair style, eye color, clothing, age, or any facial features between images. All ${totalImages || 4} images show the IDENTICAL character`)
  }

  // Art style - with CONSISTENT style tokens
  let styleDescription = ''
  if (parsed.artStyles.length > 0) {
    const style = parsed.artStyles[0]
    if (style.includes('anime') || style.includes('manga')) {
      styleDescription = 'Vibrant anime style illustration, Studio Ghibli inspired, soft pastel colors, expressive character design, whimsical and warm atmosphere, consistent anime art style'
    } else if (style.includes('watercolor')) {
      styleDescription = 'Soft watercolor painting, gentle brushstrokes, pastel colors, dreamy children\'s book illustration, flowing and ethereal, consistent watercolor technique'
    } else if (style.includes('3d') || style.includes('pixar')) {
      styleDescription = 'Cute 3D illustration, Pixar-style, rounded features, volumetric lighting, glossy cartoon rendering, consistent 3D rendering style'
    } else {
      styleDescription = `${style} style illustration with consistent visual approach`
    }
  } else {
    // Default to storybook style
    styleDescription = 'Classic children\'s storybook illustration, warm inviting colors, detailed but not cluttered, traditional book art, consistent storybook aesthetic'
  }
  parts.push(styleDescription)

  // Base story/scene
  parts.push(`Scene showing: ${baseStory}`)

  // Mood/atmosphere
  if (parsed.moods.length > 0) {
    parts.push(`${parsed.moods[0]} atmosphere maintained consistently`)
  }

  // Lighting - must be consistent
  if (parsed.lighting.length > 0) {
    parts.push(`${parsed.lighting[0]} with same lighting quality throughout the series`)
  }

  // Color palette - enforce consistency
  if (parsed.colors.length > 0) {
    parts.push(`${parsed.colors[0]} color palette - use EXACT same color scheme as other images`)
  }

  // Final multi-layered consistency enforcement
  parts.push('ESSENTIAL REQUIREMENTS: (1) Same character in all images - identical appearance (2) Same art style and technique (3) Consistent lighting and colors (4) Child-friendly storybook quality (5) This image must look like it belongs to the same visual series as the other images')

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
