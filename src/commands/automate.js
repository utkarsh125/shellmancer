import chalk from "chalk";
import { getApiKey } from "../config.js";
import inquirer from "inquirer";
import { queryGemini } from "../api.js";
import { spawn } from "child_process";

export async function automateTask(description) {
  //TODO: Currently it is not universally possible to automate everything
  //TODO: but I believe it can be done by defining rules for all type of automations.
  //TODO: and that would cost time
  const apiKey = await getApiKey();

  const promptText = `Generate a list of shell commands to ${description} and output them as plain text, one command per line, with no markdown formatting or extra explanations.
        For each command, if it depends on a resource (such as a Docker container, a directory, or a file), include a pre-check that verifies the resource exists.
        For example, for a Docker command like "docker start my-container", output:
        if docker inspect my-container > /dev/null 2>&1; then docker start my-container; else echo "Container my-container does not exist"; fi
        For a directory command like "cd /path/to/dir", output:
        if [ -d /path/to/dir ]; then cd /path/to/dir; else echo "Directory /path/to/dir does not exist"; fi
        For a file command like "cat /path/to/file", output:
        if [ -f /path/to/file ]; then cat /path/to/file; else echo "File /path/to/file does not exist"; fi`;

  const result = await queryGemini(apiKey, promptText);

  if (result) {
    const output =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "[No commands generated]";

    //display the raw response
    console.log(chalk.blue("Automation Commands: "));
    console.log(chalk.yellow(output));

    const commands = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    if (commands.length === 0) {
      console.log("No valid commands found to execute");
      return;
    }

    //Prompt usr if they want to continue to execute the commands one by one

    const { execute } = await inquirer.prompt([
      {
        type: "confirm",
        name: "execute",
        message:
          "Do you want to execute these commands one by one? (EXPERIMENTAL): ",
        default: false,
      },
    ]);

    if (execute) {
      //TODO: modify the execution such that even if one command fails, it jumps to the next
      for (const cmd of commands) {
        console.log(`Executing: ${cmd}`);
        try {
          await execCommand(cmd);
        } catch (error) {
          console.error(
            chalk.red(`Error executing command: ${cmd}: `, error.message)
          );
          const { continueExec } = await inquirer.prompt([
            {
              type: "confirm",
              name: "continueExec",
              message: "Do you want to continue executing the next commands",
              default: false,
            },
          ]);

          if (!continueExec) {
            console.log(chalk.yellow("Stopping execution..."));
            break;
          }
        }
      }
    } else {
      console.log(chalk.red("No response from Gemini."));
    }
  }
}

//TODO:Some CLI commands like npx create-next-app@latest might have their own CLI.
//TODO:Spawn allows interactive commands to work properly
//TODO:Learn about spawn processes
function execCommand(command) {
  return new Promise((resolve, reject) => {
    //spawn child
    const child = spawn(command, { shell: true, stdio: "inherit" }); //inherit any interactive commands

    child.on("error", (error) => {
      reject(error);
    });

    //when process exits, check its exit code
    child.on("exit", (code) => {
      if (code !== 0) {
        //status code 0 represents that everything is fine
        //in this case != 0 -> so not fine
        reject(new Error(`Command exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}
