import prisma from "./prisma";
import { Status } from "@prisma/client";
import { runConversion } from "./runConversion";

export async function convertPending() {
    try {
        console.log('Fetching pending videos...');
        const pendingVideos = await prisma.video.findMany({
            where: {
                processStatus: Status.PENDING
            }
        });

        console.log(`Found ${pendingVideos.length} pending videos.`);

        for (const video of pendingVideos) {
            console.log(`Processing video ID: ${video.id}, URL: ${video.videoLink}`);
            try {
                await runConversion(video.videoLink, video.id);
                console.log(`Successfully processed video ID: ${video.id}`);
            } catch (error) {
                console.error(`Error processing video ID: ${video.id}`, error);
                // Optionally, update the video status to FAILED in the database
                await prisma.video.update({
                    where: { id: video.id },
                    data: { processStatus: Status.FAILED }
                });
            }
        }

        console.log('Pending videos processed successfully.');
    } catch (error) {
        console.error('Error processing pending videos:', error);
    }
}
