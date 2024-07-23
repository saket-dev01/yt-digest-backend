import express, { Request, Response } from 'express';
import { runConversion } from './runConversion';


import prisma from './prisma';
import { convertPending } from './convertPending';
const app = express();
const port = 3001;

app.use(express.json());

app.get('/test', async (req: Request, res: Response) => {
    const vids = await prisma.video.findMany({});
    res.status(200).json(vids)
});

app.post('/download', async (req: Request, res: Response) => {
    const { url } = req.body;
    const id = (req.query.id as string) || "";
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = runConversion(url, id);
        res.status(200).json("Conversion Enqueued")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

app.listen(port, () => {
    convertPending();
    console.log(`Server is running on http://localhost:${port}`);
});
