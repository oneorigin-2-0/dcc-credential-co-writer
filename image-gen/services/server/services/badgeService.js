import { Client } from "@gradio/client";

const generateBadgeImage = async (config) => {
    try {
        const gradioClient = await Client.connect("http://127.0.0.1:7870/");
        const result = await gradioClient.predict("/generate_from_json", {
            json_text: JSON.stringify(config)
        });
        return result.data;
    } catch (error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
};

export default {
    generateBadgeImage
};