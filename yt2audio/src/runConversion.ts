import { exec } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import prisma from './prisma';
import { generateNotes } from './generateNotes';
import { Status } from '@prisma/client';

export async function runConversion(url: string, id: string) {
    const output = path.resolve(__dirname, '..', 'downloads', `${Date.now()}.mp3`);
    try {
        console.log(`Starting conversion for URL: ${url}`);
        await exec(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output
        });
        console.log(`Audio extracted successfully: ${output}`);

        // Send the file to the /convert endpoint
        const form = new FormData();
        form.append('file', fs.createReadStream(output));

        console.log(`Sending extracted audio to conversion endpoint for video ID: ${id}`);
        const response = await axios.post(`http://whisper-fastapi:8000/convert?id=${id}`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log(`Received response from conversion endpoint for video ID: ${id}`);
        fs.unlinkSync(output); // Delete the file after sending
        console.log(`Deleted temporary file: ${output}`);

        // We have the id, we just need the text, and the notes
        const notes = await generateNotes(response.data.text);
        console.log(`Generated notes for video ID: ${id}`);

        const updateVideo = await prisma.video.update({
            data: {
                text: response.data.text,
                processStatus: Status.COMPLETED,
                summary: notes
            },
            where: {
                id
            }
        });

        console.log(`Updated database for video ID: ${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error during conversion for video ID: ${id}`, error);

        // Cleanup the temporary file in case of an error
        if (fs.existsSync(output)) {
            fs.unlinkSync(output);
            console.log(`Deleted temporary file due to error: ${output}`);
        }

        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to send the file to the conversion endpoint: ${error.message}`);
        } else if (error instanceof Error && error.message.includes('youtube-dl-exec')) {
            throw new Error(`Failed to extract audio: ${error.message}`);
        } else if (error instanceof Error && error.message.includes('generateNotes')) {
            throw new Error(`Failed to generate notes: ${error.message}`);
        } else {
            throw new Error('Failed to process the request');
        }
    }
}
