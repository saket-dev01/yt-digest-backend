import OpenAI from 'openai';

require('dotenv').config()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateNotes(transcript: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "You are an expert study assistant. Your task is to create concise, clear study notes in english from video transcripts. Focus on key concepts, important facts, and main ideas. Use bullet points for clarity. Also give some practice questions only if relevant." },
        { role: "user", content: `Please create short, exam-focused study notes from the following video transcript:\n\n${transcript}` }
      ],
      temperature: 0.5, // Lower temperature for more focused output
      max_tokens: 2000, // Increased token limit for longer notes
    });

    const studyNotes = response.choices[0]?.message?.content;

    if (!studyNotes) {
      throw new Error('No study notes generated');
    }

    return studyNotes.trim();
  } catch (error) {
    console.error('Error generating study notes:', error);
    throw new Error('Failed to generate study notes');
  }
}