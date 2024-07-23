import prisma from "./prisma";
import { Status } from "@prisma/client";
import { runConversion } from "./runConversion";
export async function convertPending() {
    try{
        const pendingVideos = await prisma.video.findMany({
            where:{
                processStatus: Status.PENDING
            }
        })

        for (const video of pendingVideos) {
            await runConversion(video.videoLink, video.id)
        }

        console.log('Pending videos processed successfully.');
    }catch (error) {
        console.error('Error processing pending videos:', error);
    }
}