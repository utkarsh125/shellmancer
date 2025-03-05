//This will be used to pass in queries related to terminal

import chalk from 'chalk';
import { getApiKey } from '../config.js';
import { queryGemini } from '../api.js';

export async function explainCommand(command){

    const apiKey = await getApiKey();
    const prompt = `

    YOU ARE EMPLOYED AS CLI TOOL TO EXPLAIN ERRORS
    
    Explain the shell command: "${command}" in simple, beginner friendly terms.
    if no shell command is passed in query then just ask them to use
    "shellmancer explain <command>".
    If a prompt with no relation to the shell is passed then answer accordingly to the parameter passed
    but prompt them that this is unrelated to any shell commands where applicable.
    DO NOT INCLUDE SENTENCES LIKE
    "Okay, I understand. Here's how I'll respond to your requests"
    JUST JUMP STRAIGHT TO THE SOLUTION IN A MONOTONOUS TONE
    ANSWER SHOULD NOT CONTAIN ANY MARKDOWN FORMATTING
    ANSWER GENERATED SHOULD BE VISIBLE CLEARLY IN THE COMMAND LINE INTERFACE
    `

    const result = await queryGemini(apiKey, prompt);

    if(result){
        const explanation =
            result.candidates?.[0]?.content?.parts?.[0]?.text || "[No explanation provided]"
        console.log(chalk.blue("Explanation: ", chalk.greenBright(explanation)));
    }else{
        console.log(chalk.red("No response from Gemini."));
    }
}