import RemoveMarkdown from "remove-markdown";
import chalk from "chalk";
import { displayBanner } from "../display.js";
import { getApiKey } from "../config.js";
import inquirer from "inquirer";
import { queryGemini } from "../api.js";

export async function startChatbot(){

    //before booting the chatbot show banner
    displayBanner();

    await new Promise((resolve) => setTimeout(resolve, 700));
    const apiKey = await getApiKey();

    while(true){
        const userMessage = await askForMessage();
        if(userMessage.toLowerCase() === "exit"){
            console.log(chalk.yellow("Exiting shellmancer..."));
            break;
        }

        const result = await queryGemini(apiKey, userMessage);

        if(result){
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[No text response]";

            const plainText = RemoveMarkdown(responseText);
            console.log(chalk.blue("Gemini Bot Says: "), chalk.yellow(plainText) + "\n");
        }else{
             console.log(chalk.red("No response from Gemini."));
        }
    }
}

async function askForMessage(){

    try {
        

        const { message } = await inquirer.prompt([
            {
                type: "input",
                "name":"message",
                message: "Ask your query to Gemini (or type 'exit' to quit): "
            },

        ]);
        return message;
    } catch (error) {
        console.log(chalk.red("\nshellmancer interrupted, exiting..."));
        process.exit(0);
    }
}