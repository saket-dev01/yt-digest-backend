import express, { Request, Response, NextFunction } from 'express';
import { runConversion } from './runConversion';
import prisma from './prisma';
import { convertPending } from './convertPending';

const app = express();
const port = 3001;

// Middleware to log requests
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use(express.json());

app.get('/test', async (req: Request, res: Response) => {
    try {
        const vids = await prisma.video.findMany({});
        res.status(200).json(vids);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

app.post('/download', async (req: Request, res: Response) => {
    const { url } = req.body;
    const id = (req.query.id as string) || "";
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Assuming runConversion returns a Promise or handles async internally
        const response = await runConversion(url, id);
        res.status(200).json("Conversion Enqueued");
    } catch (error) {
        console.error('Error converting video:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, () => {
    convertPending();
    console.log(`Server is running on http://localhost:${port}`);
});
