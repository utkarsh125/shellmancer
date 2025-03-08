import chalk from "chalk";
import { displayBanner } from "../display.js";
import { exec } from "child_process";
import fs from "fs";
import { getApiKey } from "../config.js";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { queryGemini } from "../api.js";
import readline from "readline";

function isOSCommand(cmd) {
  const firstToken = cmd.split(" ")[0];
  const platform = os.platform();
  const lookupCommand = platform === "win32" ? "where" : "which";
  return new Promise((resolve) => {
    exec(`${lookupCommand} ${firstToken}`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
}

function executeOSCommand(cmd) {
  const platform = os.platform();
  const shellOption = platform === "win32" ? "cmd.exe" : undefined;
  exec(cmd, { shell: shellOption }, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error executing command: ${error.message}`));
      return;
    }
    if (stderr) {
      console.error(chalk.red(`stderr: ${stderr}`));
    }
    console.log(chalk.cyan(stdout));
  });
}

async function automateTask(taskDescription, apiKey) {
  const promptText = `Generate a bash script to ${taskDescription}`;
  console.log(chalk.blue("Generating automation script..."));
  const result = await queryGemini(apiKey, promptText);
  if (result) {
    const script =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "[No script generated]";
    console.log(chalk.yellow("Generated Script:"));
    console.log(script);
    const { executeScript } = await inquirer.prompt([
      {
        type: "confirm",
        name: "executeScript",
        message: "Do you want to execute this script?",
        default: false,
      },
    ]);
    if (executeScript) {
      const platform = os.platform();
      const shellOption = platform === "win32" ? "cmd.exe" : undefined;
      exec(script, { shell: shellOption }, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Error executing script: ${error.message}`));
          return;
        }
        if (stderr) {
          console.error(chalk.red(`stderr: ${stderr}`));
        }
        console.log(chalk.green("Script Output:"), stdout);
      });
    }
  } else {
    console.log(chalk.red("No script generated for automation."));
  }
}

export async function startInteractiveShell() {
  displayBanner();
  console.log(
    chalk.blueBright("Entering interactive shell mode. Type 'exit' to quit.\n")
  );

  const apiKey = await getApiKey();
  const conversationHistory = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green("shellmancer> "),
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase() === "exit") {
      rl.close();
      return;
    }
    
    // Always add the user input to the conversation history
    conversationHistory.push(`User: ${trimmedLine}`);

    // Handle built-in "list files" command
    if (trimmedLine.toLowerCase().startsWith("list files")) {
      let dir = trimmedLine.substring("list files".length).trim();
      if (!dir) {
        dir = process.cwd();
      }
      dir = path.resolve(dir);
      try {
        const files = fs.readdirSync(dir);
        console.log(chalk.cyan(`Files in ${dir}:`));
        files.forEach((file) => {
          console.log(chalk.cyan(file));
        });
      } catch (err) {
        console.error(chalk.red(`Error listing files in ${dir}: ${err.message}`));
      }
      rl.prompt();
      return;
    }

    // Handle the "cd" command
    if (trimmedLine.startsWith("cd ")) {
      const dir = trimmedLine.slice(3).trim();
      try {
        process.chdir(dir);
        console.log(chalk.green(`Changed directory to ${process.cwd()}`));
      } catch (err) {
        console.error(chalk.red(`Error changing directory: ${err.message}`));
      }
      rl.prompt();
      return;
    }
    
    // Handle built-in "system-info" command (if implemented)
    if (trimmedLine === "system-info") {
      // Example: call systemInfo();
      rl.prompt();
      return;
    }

    // Handle the "automate" command
    if (trimmedLine.toLowerCase().startsWith("automate ")) {
      const taskDescription = trimmedLine.slice("automate ".length).trim();
      if (!taskDescription) {
        console.log(chalk.red("Please provide a task description for automation."));
        rl.prompt();
        return;
      }
      await automateTask(taskDescription, apiKey);
      rl.prompt();
      return;
    }

    // Check if the input is an OS command by looking up the first token.
    const isCommand = await isOSCommand(trimmedLine);
    if (isCommand) {
      executeOSCommand(trimmedLine);
      rl.prompt();
      return;
    }

    // Otherwise, treat the input as a Gemini query.
    const contextPrompt = conversationHistory.join("\n");
    const result = await queryGemini(apiKey, contextPrompt);
    if (result) {
      const responseText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "[No text response]";
      console.log(chalk.yellow("Gemini Bot:"), chalk.yellow(responseText));
      conversationHistory.push(`Gemini Bot: ${responseText}`);
    } else {
      console.log(chalk.red("No response from Gemini."));
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.yellow("Exiting shellmancer interactive mode..."));
    process.exit(0);
  });
}
