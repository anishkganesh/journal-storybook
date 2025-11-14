# Journal to Storybook ✨

Transform your handwritten journal entries into beautiful illustrated storybooks using AI!

Built with a modern chat-based UI, natural language parsing, and the power of OpenAI's GPT-4o and DALL-E 3.

## 🎨 Features

- **Chat-Based Interface**: Intuitive chat UI with minimal, professional design using Geist font
- **OCR (Optical Character Recognition)**: Upload photos of handwritten journal entries - AI reads your handwriting using GPT-4o-mini Vision
- **Natural Language Parsing**: Describe your preferred style in plain English
  - "Make it anime style with a brave knight"
  - "Watercolor with soft colors and a young girl"
  - "3D Pixar style with a playful character"
- **Smart Story Generation**: Automatically expands your journal into engaging 4-sentence children's stories
- **DALL-E 3 Image Generation**: Creates 4 beautiful, consistent illustrations
- **Character Consistency**: Maintains the same character appearance across all images
- **Multiple Art Styles**: Anime, watercolor, 3D cartoon, storybook, and more via natural language

## 💰 Cost Estimate

Generating a complete storybook costs approximately **$0.17-0.35**:
- OCR: ~$0.003 per image
- Story generation: ~$0.01
- 4 images (standard quality): $0.16
- 4 images (HD quality): $0.32

Much cheaper than traditional illustration services!

## 🚀 Quick Start

### Using the Chat Interface

1. **Attach your journal photo** using the paperclip icon
2. **Optionally add style instructions** like "anime style" or "with a princess character"
3. **Send** and watch the AI:
   - Read your handwriting
   - Generate a story
   - Create 4 illustrated pages
   - Display your complete storybook!

### Example Prompts

- Just upload an image → Default storybook style
- "Make it anime style" → Studio Ghibli-inspired art
- "Watercolor with a boy character" → Custom style + character
- "Pixar 3D with dramatic lighting" → Specific style preferences

## Technical Details

### Technologies Used

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui (Tailwind CSS v4)
- **Typography**: Geist Sans & Geist Mono fonts
- **Natural Language Processing**: Custom parser for style extraction
- **AI APIs**: OpenAI (GPT-4o-mini + DALL-E 3)
- **Deployment**: Vercel-ready configuration

### Workflow

1. **OCR Phase**
   - Image uploaded and converted to base64
   - Sent to GPT-4o-mini Vision API with OCR prompt
   - Text extracted and displayed for editing

2. **Story Generation Phase**
   - Journal entry sent to GPT-4o-mini
   - Expanded into 4-sentence children's story
   - Character description extracted from story

3. **Image Generation Phase**
   - Each sentence becomes a DALL-E 3 prompt
   - Character description maintained across all images
   - Style keywords ensure consistent art style
   - 2-second delay between generations for rate limiting

## Environment Variables

The OpenAI API key is already configured in `.env.local`

**⚠️ Security Note**: The API key is exposed in the browser (using `dangerouslyAllowBrowser: true`). For production, implement a backend API to secure your API keys.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
journal-storybook/
├── src/
│   ├── components/ui/     # shadcn/ui components
│   ├── lib/               # utility functions
│   ├── App.tsx            # main application
│   ├── index.css          # Tailwind CSS
│   └── main.tsx           # entry point
├── .env.local             # environment variables (API key)
├── components.json        # shadcn/ui configuration
├── package.json
└── vite.config.ts
```

## Future Improvements

- Add backend API to secure OpenAI API key
- Add download/export functionality for storybook
- Support for multiple journal entries in one session
- PDF export of complete storybook
- Image editing and regeneration options
- Save/load previous storybooks
- More art styles and customization options

## Troubleshooting

**Issue**: OCR not working
- Check that your API key is valid
- Ensure the image is clear and legible
- Try with a different image format

**Issue**: Images not generating
- Check your OpenAI account has sufficient credits
- Verify rate limits haven't been exceeded
- Wait 2-3 seconds between generations

**Issue**: Story quality is poor
- Edit the extracted text to be more descriptive
- Try uploading a clearer photo
- Manual entry works too!
