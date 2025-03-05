import axios from "axios";
import chalk from "chalk";
import { getDefaultModel } from "./config.js";

export async function queryGemini(apiKey, query){
    const model = getDefaultModel();//fetch the default model

    //TODO: This URL might change in future so, will update in future versions
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`


    try {
        
        const response = await axios.post(
            url,
            {
                contents: [
                    {
                        parts: [ {text: query }]
                    },
                ],
            },
            {
                headers: {"Content-Type": "application/json"},
            },
        );

        // console.log("DebugLog@api.js Line 28: ", response.data);
        return response.data;
    } catch (error) {
        console.error(chalk.red('Error querying Gemini: ', error.message));
        return null;
    }
}