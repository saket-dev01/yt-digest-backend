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
exports.runConversion = void 0;
const youtube_dl_exec_1 = require("youtube-dl-exec");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
function runConversion(url, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const output = path_1.default.resolve(__dirname, '..', 'downloads', `${Date.now()}.mp3`);
            yield (0, youtube_dl_exec_1.exec)(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                output
            });
            // Send the file to the /convert endpoint
            const form = new form_data_1.default();
            form.append('file', fs_1.default.createReadStream(output));
            const response = yield axios_1.default.post(`http://whisper-fastapi:8000/convert?id=${id}`, form, {
                headers: Object.assign({}, form.getHeaders())
            });
            // Send the response from the /convert endpoint back to the client
            fs_1.default.unlinkSync(output); // Delete the file after sending
            // yaha pe we should call the web hook
            //
            //const webhookResponse = await axios.post(`https://yt-digest-frontend.vercel.app/api/webhook`, response.data);
            // yaha pe hi update the db
            return response.data;
        }
        catch (error) {
            console.error(error);
            throw new Error("Failed to process the request");
        }
    });
}
exports.runConversion = runConversion;
