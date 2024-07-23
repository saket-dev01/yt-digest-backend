import { exec } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import prisma from './prisma';
import { generateNotes } from './generateNotes';
import { Status } from '@prisma/client';

export async function runConversion(url:string, id:string){
    try {
        const output = path.resolve(__dirname, '..', 'downloads', `${Date.now()}.mp3`);
        await exec(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output
        });

        // Send the file to the /convert endpoint
        const form = new FormData();
        form.append('file', fs.createReadStream(output));

        const response = await axios.post(`http://whisper-fastapi:8000/convert?id=${id}`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        
        
        fs.unlinkSync(output); // Delete the file after sending
        //we have the id, we just need the text, and the notes
        const notes = await generateNotes(response.data.text);
        const updateVideo = await prisma.video.update({
            data:{
                text: response.data.text,
                processStatus: Status.COMPLETED,
                summary:notes
            },
            where:{
                id
            }
        })
        console.log(`Converted the video with id: ${response.data.id}`)
         
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to process the request")
    }
}