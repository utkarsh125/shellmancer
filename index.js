#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import figlet from "figlet";
import fs from "fs";
import gradient from "gradient-string";
import inquirer from "inquirer";
import os from "os";
import path from "path";

const apiKeyFilePath = path.join(os.homedir(), ".gemini_api_key");
let DEFAULT_MODEL = "gemini-2.0-flash";

function displayBanner() {
  figlet("shell-sage", (error, data) => {
    if (error) {
      console.error(chalk.red("Error generating banner."));
      return;
    }
    console.log(gradient.pastel.multiline(data));
  });
  console.log(chalk.bgGreen("Terminal chatbot for the minimalistic experience"));
  console.log(chalk.bgMagentaBright("creator: utkarsh125"));
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

function saveApiKey(apiKey) {
  fs.writeFileSync(apiKeyFilePath, apiKey, { encoding: "utf8", flag: "w" });
}

function removeApiKey() {
  if (fs.existsSync(apiKeyFilePath)) {
    fs.unlinkSync(apiKeyFilePath);
    console.log(chalk.red("API Key removed successfully!"));
  } else {
    console.log(chalk.yellow("No API Key found to remove."));
  }
}

async function askForAPI() {
  let apiKey = loadApiKey();
  if (apiKey) {
    console.log(chalk.green("Loaded API Key from storage.\n"));
    return apiKey;
  }

  console.log(chalk.blue("You can get your API key from: https://aistudio.google.com/apikey\n"));
  const response = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Enter your Gemini API Key (will be stored on your machine): ",
      validate: (input) => (input.trim() ? true : "API key cannot be empty"),
    },
  ]);
  apiKey = response.apiKey.trim();
  saveApiKey(apiKey);
  console.log(chalk.green("API Key saved successfully!\n"));
  return apiKey;
}

async function fetchAvailableModels(apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const response = await axios.get(url);
    return response.data.models.map((model) => model.name);
  } catch (error) {
    console.error(chalk.red("Failed to fetch available models."));
    return [DEFAULT_MODEL];
  }
}

async function askForModel(apiKey) {
  const models = await fetchAvailableModels(apiKey);
  const response = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Select the model you want to use:",
      choices: models,
      default: DEFAULT_MODEL,
    },
  ]);
  DEFAULT_MODEL = response.model;
  console.log(chalk.green(`Model set to: ${DEFAULT_MODEL}\n`));
}

async function askForMessage() {
  const { message } = await inquirer.prompt([
    {
      type: "input",
      name: "message",
      message: "Ask your query to Gemini (or type 'exit' to quit): ",
    },
  ]);
  return message;
}

async function callGeminiAPI(apiKey, message) {
  const spinner = createSpinner("Calling Gemini API...").start();
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: message }] }] };
    const response = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });
    spinner.success({ text: "Response received!" });
    if (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      return "No output returned";
    }
  } catch (error) {
    spinner.error({ text: "Error calling Gemini API." });
    console.error(chalk.red(error));
    return null;
  }
}

function showHelp() {
  console.log(`\nUsage: shell-sage [options]\n`);
  console.log("Options:");
  console.log("  --help         Show available commands");
  console.log("  --version      Show version info");
  console.log("  --model        Show current and available models");
  console.log("  --remove-api   Remove stored API key\n");
}

function showVersion() {
  console.log("Shell-Sage CLI v1.0.0");
}

async function showModelInfo(apiKey) {
  const models = await fetchAvailableModels(apiKey);
  console.log("Current model: " + chalk.green(DEFAULT_MODEL));
  console.log("Available models:");
  models.forEach((model) => console.log(`  - ${model}`));
}

async function startGeminiBot() {
  displayBanner();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const apiKey = await askForAPI();
  await askForModel(apiKey);
  while (true) {
    const userMessage = await askForMessage();
    if (userMessage.toLowerCase() === "exit") {
      console.log(chalk.yellow("Exiting GeminiBot CLI..."));
      break;
    }
    const response = await callGeminiAPI(apiKey, userMessage);
    if (response) {
      console.log(chalk.blue("Gemini Bot says: " + response), "\n");
    }
  }
}

const args = process.argv.slice(2);
const apiKey = loadApiKey();
if (args.includes("--help")) {
  showHelp();
} else if (args.includes("--version")) {
  showVersion();
} else if (args.includes("--model")) {
  showModelInfo(apiKey);
} else if (args.includes("--remove-api")) {
  removeApiKey();
} else {
  startGeminiBot();
}