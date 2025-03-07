import chalk from "chalk";
import { getApiKey } from "../config.js";
import { queryGemini } from "../api.js";

export async function fixError(errorMessage) {
  const apiKey = await getApiKey();
  const prompt = `
    I'm receiving the following error message in my terminal: \n\n "${errorMessage}"\n\n
    Can you suggest possible fixes and explain what might be causing this error? 
    Please provide actionable steps.

    DO NOT USE ANY MARKDOWN, XML OR HTML IN YOUR RESPONSE
    `;

    const result = await queryGemini(apiKey, prompt);

    if(result){
        // console.log(chalk.green("Reference this: ", result))
        const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text || "[No suggestions provided]";
        console.log(chalk.blue("Suggested Fix: "), chalk.yellow(suggestion));
    }else{
        console.log(chalk.red("No response from Gemini."));
    }
}
