#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { exec } from "child_process";
import figlet from "figlet";
import fs from "fs";
import gradient from "gradient-string";
import inquirer from "inquirer";
import os from "os";
import path from "path";

const apiKeyFilePath = path.join(os.homedir(), ".gemini_api_key");
// Set the default model to use
let DEFAULT_MODEL = "gemini-2.0-flash";

function displayBanner() {
  figlet("shell-sage", (error, data) => {
    if (error) {
      console.error(chalk.red("Error generating banner."));
      return;
    }
    console.log(gradient.pastel.multiline(data));
  });
  console.log(chalk.blueBright("Terminal chatbot for the minimalistic experience"));
  console.log(chalk.greenBright("creator: utkarsh125"));
}

function loadApiKey() {
  if (fs.existsSync(apiKeyFilePath)) {
    const storedKey = fs.readFileSync(apiKeyFilePath, "utf8").trim();
    if (storedKey) {
      return storedKey;
    }
  }
  return null;
}

async function promptForApiKey() {
  const { apiKey } = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Enter your Gemini API Key: ",
      validate: (input) => (input ? true : "API key cannot be empty."),
    },
  ]);
  fs.writeFileSync(apiKeyFilePath, apiKey, "utf8");
  return apiKey;
}

async function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    exec("npm show shell-sage version", (error, stdout) => {
      if (error) {
        reject("Failed to fetch latest version.");
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function updatePackage() {
  console.log(chalk.blue("Checking for updates..."));

  // Remove API key before updating
  removeApiKey();

  try {
    const latestVersion = await fetchLatestVersion();
    console.log(chalk.green(`Latest version available: v${latestVersion}`));
    console.log(chalk.blue("Updating shell-sage to the latest version..."));
    exec("npm install -g shell-sage", (error, stdout) => {
      if (error) {
        console.error(chalk.red("Update failed: " + error.message));
        return;
      }
      console.log(chalk.green("Update successful!"));
      console.log(stdout);
    });
  } catch (error) {
    console.error(chalk.red(error));
  }
}

function removeApiKey() {
  if (fs.existsSync(apiKeyFilePath)) {
    fs.unlinkSync(apiKeyFilePath);
    console.log(chalk.yellow("API key removed."));
  } else {
    console.log(chalk.red("No stored API key found."));
  }
}

function showHelp() {
  console.log(`\nUsage: shell-sage [options]\n`);
  console.log("Options:");
  console.log("  --help         Show available commands");
  console.log("  --version      Show version info");
  console.log("  --model        Show the current model");
  console.log("  --remove-api   Remove stored API key");
  console.log("  --update       Update shell-sage to the latest version\n");
}

function showVersion() {
  fetchLatestVersion()
    .then((latestVersion) => console.log(`Shell-Sage CLI v${latestVersion}`))
    .catch(() => console.log("Shell-Sage CLI (version fetch failed)"));
}

function showModel() {
  console.log("Current model: " + chalk.green(DEFAULT_MODEL));
}

// New function to send a query to the Gemini API using the dynamic endpoint
async function queryGemini(apiKey, query) {
  // Build the endpoint URL using the DEFAULT_MODEL and the API key
  const url = `https://generativelanguage.googleapis.com/v1/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  try {
    const response = await axios.post(
      url,
      {
        // The request body follows the expected format
        contents: [
          {
            parts: [
              {
                text: query
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(chalk.red("Error querying Gemini:"), error.message);
    return null;
  }
}

async function startChatbot() {
  displayBanner();
  await new Promise((resolve) => setTimeout(resolve, 700));

  let apiKey = loadApiKey();
  if (!apiKey) {
    console.log(chalk.red("No API key found. Please enter one."));
    apiKey = await promptForApiKey();
  }

  while (true) {
    const userMessage = await askForMessage();
    if (userMessage.toLowerCase() === "exit") {
      console.log(chalk.yellow("Exiting Shell-Sage..."));
      break;
    }
    const result = await queryGemini(apiKey, userMessage);
    if (result) {
      // Display the response text extracted from the response data
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[No text response]";
      console.log(chalk.blue("Gemini Bot says: ") + chalk.yellow(responseText) + "\n");
    } else {
      console.log(chalk.red("No response from Gemini."));
    }
  }
}

process.on("SIGINT", () => {
  console.log(chalk.red("\n\nShell-Sage interrupted through CTRL+C, exiting..."));
  process.exit(0);
});

async function askForMessage() {
  try {
    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Ask your query to Gemini (or type 'exit' to quit): ",
      },
    ]);
    return message;
  } catch (error) {
    console.log(chalk.red("\nShell-Sage interrupted through CTRL+C, exiting..."));
    process.exit(0);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  startChatbot();
} else if (args.includes("--help")) {
  showHelp();
} else if (args.includes("--version")) {
  showVersion();
} else if (args.includes("--model")) {
  showModel();
} else if (args.includes("--remove-api")) {
  removeApiKey();
} else if (args.includes("--update")) {
  updatePackage();
} else {
  console.log(chalk.red("Invalid command. Use --help to see available options."));
}
