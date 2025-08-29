import { Client } from "@gradio/client";
import fs from 'fs';

const generateBadgeImage = async (config) => {
    try {
        const gradioClient = await Client.connect("http://127.0.0.1:7870/");
        const result = await gradioClient.predict("/generate_from_json", {
            json_text: JSON.stringify(config)
        });
        
        // Get the file path from the result
        const filePath = result.data[0].path;
        
        // Read the file and convert to base64
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = result.data[0].orig_name.endsWith('.webp') ? 'image/webp' : 'image/png';
        
        return {
            base64: `data:${mimeType};base64,${base64Image}`,
            filename: result.data[0].orig_name,
            mimeType: mimeType
        };
    } catch (error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
};

export default {
    generateBadgeImage
};