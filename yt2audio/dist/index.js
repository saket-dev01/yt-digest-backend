"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const runConversion_1 = require("./runConversion");
const prisma_1 = __importDefault(require("./prisma"));
const app = (0, express_1.default)();
const port = 3001;
app.use(express_1.default.json());
app.get('/test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const vids = yield prisma_1.default.video.findMany({});
    res.status(200).json(vids);
}));
app.post('/download', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.body;
    const id = req.query.id || "";
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const response = (0, runConversion_1.runConversion)(url, id);
        res.status(200).json("Conversion Enqueued");
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
