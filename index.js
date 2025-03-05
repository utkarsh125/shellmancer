#!/usr/bin/env node

import { showHelp, showVersion } from "./src/display.js";

import chalk from "chalk";
import { explainCommand } from "./src/commands/explain.js";
import { generateScript } from "./src/commands/generateScript.js";
import { getDefaultModel } from "./src/config.js";
import { removeApiKey } from "./src/config.js";
import { setModel } from "./src/commands/setModel.js";
import { startChatbot } from "./src/commands/chatbot.js";
import { systemInfo } from "./src/commands/systemInfo.js";
import { updatePackage } from "./src/commands/update.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: start interactive chatbot mode
  startChatbot();
} else {
  const command = args[0];
  switch (command) {
    case "explain": {
      const cmdToExplain = args.slice(1).join(" ");
      if (!cmdToExplain) {
        console.log(chalk.red("Please provide a shell command to explain."));
      } else {
        explainCommand(cmdToExplain);
      }
      break;
    }
    case "generate-script": {
      const description = args.slice(1).join(" ");
      if (!description) {
        console.log(chalk.red("Please provide a description for script generation."));
      } else {
        generateScript(description);
      }
      break;
    }
    case "system-info":
      systemInfo();
      break;
    case "set-model": {
      const newModel = args[1];
      if (!newModel) {
        console.log(chalk.red("Please provide a model name."));
      } else {
        setModel(newModel);
      }
      break;
    }
    case "--help":
      showHelp();
      break;
    case "--version":
      showVersion();
      break;
    case "--model":
      console.log("Current model:", chalk.green(getDefaultModel()));
      break;
    case "--remove-api":
      removeApiKey();
      break;
    case "--update":
      updatePackage();
      break;
    default:
      console.log(chalk.red("Invalid command. Use --help to see available options."));
  }
}
