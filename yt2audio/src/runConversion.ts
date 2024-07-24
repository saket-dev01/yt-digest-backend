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
            output,
            noPlaylist: true,
            matchFilter: 'duration < 3600',  // Limit duration to 1 hour (3600 seconds)
        });
        console.log(`Audio extracted successfully: ${output}`);

        // Update status to PROCESSING
        await prisma.video.update({
            where: { id },
            data: { processStatus: Status.PROCESSING }
        });

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

        // Generate notes from the transcribed text
        const notes = await generateNotes(response.data.text);
        console.log(`Generated notes for video ID: ${id}`);

        // Update the video in the database
        const updateVideo = await prisma.video.update({
            data: {
                text: response.data.text,
                processStatus: Status.COMPLETED,
                summary: notes
            },
            where: { id }
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

        let errorStatus: Status = Status.FAILED;
        let errorMessage = 'Failed to process the request';

        if (error instanceof Error) {
            if (error.message.includes('video matches filter "duration < 3600"')) {
                errorStatus = Status.LENGTHISSUE;
                errorMessage = 'Video exceeds maximum allowed length of 1 hour';
            } else if (error.message.includes('youtube-dl-exec')) {
                errorMessage = `Failed to extract audio: ${error.message}`;
            } else if (error.message.includes('generateNotes')) {
                errorMessage = `Failed to generate notes: ${error.message}`;
            } else if (axios.isAxiosError(error)) {
                errorMessage = `Failed to send the file to the conversion endpoint: ${error.message}`;
            } else {
                errorMessage = error.message;
            }
        }

        // Update the video status to FAILED or LENGTHISSUE
        await prisma.video.update({
            data: {
                processStatus: errorStatus,
                summary: errorMessage  // Using summary field to store error message
            },
            where: { id }
        });

        throw new Error(errorMessage);
    }
}
