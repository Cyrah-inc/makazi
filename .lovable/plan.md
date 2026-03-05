

# Update AI Description Generator - Concise Format

## What changes
Update the edge function's system prompt to generate shorter, more direct descriptions (50-80 words) in the style the user provided — descriptive, factual, and without marketing fluff.

## File: `supabase/functions/generate-description/index.ts`
- Change word count from 150-200 to 50-80 words
- Update system prompt to produce concise, descriptive text that highlights key features (rooms, amenities, environment) without excessive marketing language
- Use the user's example as a style reference in the prompt
- Remove instructions about "captivating hooks" and "compelling calls to action" — focus on clear, informative descriptions
- Keep the tone selector but make tones more subtle (less flowery)

