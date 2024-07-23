import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateNotes(transcript: string) {
  console.log('Starting to generate study notes.');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert study assistant. Your task is to create concise, clear study notes in English from video transcripts. Focus on key concepts, important facts, and main ideas. Use bullet points for clarity. Also give some practice questions only if relevant." },
        { role: "user", content: `Please create short, exam-focused study notes from the following video transcript:\n\n${transcript}` }
      ],
      temperature: 0.5, // Lower temperature for more focused output
      max_tokens: 2000, // Increased token limit for longer notes
    });

    console.log('Received response from OpenAI API.');

    const studyNotes = response.choices[0]?.message?.content;

    if (!studyNotes) {
      console.error('No study notes generated in the response.');
      throw new Error('No study notes generated');
    }

    console.log('Successfully generated study notes.');
    return studyNotes.trim();
  } catch (error) {
    console.error('Error generating study notes:', error);

    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    } else if (error instanceof Error) {
      throw new Error(`Error generating study notes: ${error.message}`);
    } else {
      throw new Error('Unknown error occurred while generating study notes');
    }
  }
}
