#!/usr/bin/env node

import axios from "axios"; // Make sure to install axios: npm install axios
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import figlet from "figlet";
import fs from "fs";
import gradient from "gradient-string";
import inquirer from "inquirer";
import os from "os";
import path from "path";

// Define the path for the API key file in the user's home directory
const apiKeyFilePath = path.join(os.homedir(), ".gemini_api_key");

// Function to display the ASCII Banner
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

// Function to load API key from persistent storage
function loadApiKey() {
  if (fs.existsSync(apiKeyFilePath)) {
    const storedKey = fs.readFileSync(apiKeyFilePath, "utf8").trim();
    if (storedKey) {
      return storedKey;
    }
  }
  return null;
}

// Function to save the API key persistently
function saveApiKey(apiKey) {
  fs.writeFileSync(apiKeyFilePath, apiKey, { encoding: "utf8", flag: "w" });
}

// Prompt user to get their API key if not stored already
async function askForAPI() {
  let apiKey = loadApiKey();
  if (apiKey) {
    console.log(chalk.green("Loaded API Key from storage.\n"));
    return apiKey;
  }

  const response = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Enter your Gemini API Key (will be stored on your machine): ",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "API key cannot be empty";
        }
        return true;
      },
    },
  ]);
  apiKey = response.apiKey.trim();
  saveApiKey(apiKey);
  console.log(chalk.green("API Key saved successfully!\n"));
  return apiKey;
}

// Prompt user for a message to send to Gemini
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

// Function to interact with the Gemini API using the updated endpoint and payload
async function callGeminiAPI(apiKey, message) {
  const spinner = createSpinner("Calling Gemini API...").start();

  try {
    // Construct the URL with the API key
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Prepare the payload according to the API documentation
    const payload = {
      contents: [
        {
          parts: [{ text: message }],
        },
      ],
    };

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    spinner.success({ text: "Response received!" });
    
    // Extract the output from the API response (this structure may vary)
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
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

async function startGeminiBot() {
  displayBanner();
  // Wait for the banner to render
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Get the API key (loaded from persistent storage if available)
  const apiKey = await askForAPI();

  // Chat loop
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

startGeminiBot();
