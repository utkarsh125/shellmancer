import chalk from "chalk";
import { getApiKey } from "../config.js";
import { queryGemini } from "../api.js";

export async function generateScript(description){

    const apiKey = await getApiKey();
    const prompt = `Generate a bash script to ${description}.
    - DO NOT INCLUDE THINGS LIKE "Here is your Script" or anything like that
    - JUST STRAIGHT AWAY GENERATE THE SCRIPT FOR THE USER TO COPY
    - ADD FLAGS ON TOP OF WHAT IT DOES and SEVERITY LEVEL
    - KEEP IT MONOTONOUS
    `
    const result = await queryGemini(apiKey, prompt);

    if(result){
        const script = result.candidates?.[0]?.content?.parts?.[0]?.text || "[No script generated]";
        console.log(chalk.blue("Generated Script: \n"), chalk.yellow(script));
    }else{
        console.log(chalk.red("No response from Gemini."));
    }
}


