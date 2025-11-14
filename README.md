# Journal to Storybook

Transform your handwritten journal entries into beautiful illustrated storybooks using AI!

## Features

- **OCR (Optical Character Recognition)**: Upload a photo of your handwritten journal entry and extract the text using OpenAI's GPT-4o-mini Vision API
- **Story Generation**: Automatically expand your journal entry into an engaging 4-sentence children's story
- **Art Style Selection**: Choose from 4 different art styles:
  - Anime (Studio Ghibli inspired)
  - Watercolor
  - 3D Cartoon (Pixar-style)
  - Classic Storybook
- **Image Generation**: Generate 4 beautiful illustrations using DALL-E 3, one for each sentence
- **Consistent Style**: Character descriptions are extracted and maintained across all images for visual consistency

## Cost Estimate

Generating a complete storybook costs approximately **$0.17-0.35**:
- OCR: ~$0.003 per image
- Story generation: ~$0.01
- 4 images (standard quality): $0.16
- 4 images (HD quality): $0.32

## How to Use

1. **The development server is running at http://localhost:5173/**

2. **Upload a handwritten journal entry**
   - Take a photo of your journal entry
   - Drag and drop or click to upload
   - Supports JPG, PNG, HEIC formats

3. **Extract text**
   - Click "Extract Text" button
   - Review and edit the extracted text if needed

4. **Choose an art style**
   - Select from Anime, Watercolor, 3D Cartoon, or Classic Storybook

5. **Generate your storybook**
   - Click "Generate Storybook"
   - Wait ~30-60 seconds for the AI to create your story and images
   - View your completed storybook!

## Technical Details

### Technologies Used

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui (Tailwind CSS)
- **File Upload**: react-dropzone
- **AI APIs**: OpenAI (GPT-4o-mini + DALL-E 3)

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
