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

  const isWindows = process.platform === "win32";
  
  // Generate OS-specific prompt
  let promptText;
  if (isWindows) {
    promptText = `Generate a list of PowerShell commands to ${description} and output them as plain text, one command per line, with no markdown formatting or extra explanations.
        IMPORTANT: You are on Windows PowerShell. Use PowerShell syntax, NOT bash/Unix syntax.
        For each command, if it depends on a resource (such as a Docker container, a directory, or a file), include a pre-check that verifies the resource exists.
        
        PowerShell Examples:
        - To create a directory: New-Item -ItemType Directory -Path "my_folder" -Force
        - To check if directory exists and change into it: if (Test-Path "my_folder") { Set-Location "my_folder" } else { Write-Host "Directory my_folder does not exist" }
        - To create a file with content: Set-Content -Path "file.txt" -Value "content here"
        - To create an empty file: New-Item -ItemType File -Path "file.txt" -Force
        - To check if file exists: if (Test-Path "file.txt") { Get-Content "file.txt" } else { Write-Host "File file.txt does not exist" }
        - To list files in current directory: Get-ChildItem
        - To list files in a specific directory: Get-ChildItem -Path "my_folder"
        - To view file contents: Get-Content "file.txt"
        - To change directory: Set-Location "my_folder" (or cd "my_folder")
        - To show current directory: Get-Location (or pwd)
        
        CRITICAL: When creating files inside a folder, you MUST change directory into that folder FIRST before creating the files. For example:
        1. Create folder: New-Item -ItemType Directory -Path "my_folder" -Force
        2. Change into folder: Set-Location "my_folder"
        3. Create files: New-Item -ItemType File -Path "file1.txt" -Force
        4. Change back: Set-Location ".."
        
        Use PowerShell cmdlets: New-Item, Set-Content, Get-Content, Test-Path, Set-Location, not Unix commands like mkdir, touch, cd, etc.`;
  } else {
    promptText = `Generate a list of shell commands to ${description} and output them as plain text, one command per line, with no markdown formatting or extra explanations.
        For each command, if it depends on a resource (such as a Docker container, a directory, or a file), include a pre-check that verifies the resource exists.
        For example, for a Docker command like "docker start my-container", output:
        if docker inspect my-container > /dev/null 2>&1; then docker start my-container; else echo "Container my-container does not exist"; fi
        For a directory command like "cd /path/to/dir", output:
        if [ -d /path/to/dir ]; then cd /path/to/dir; else echo "Directory /path/to/dir does not exist"; fi
        For a file command like "cat /path/to/file", output:
        if [ -f /path/to/file ]; then cat /path/to/file; else echo "File /path/to/file does not exist"; fi
        
        Additional Examples:
        - To list files: ls or ls /path/to/dir
        - To view file contents: cat file.txt
        - To change directory: cd my_folder
        - To show current directory: pwd
        
        CRITICAL: When creating files inside a folder, you MUST change directory into that folder FIRST before creating the files. For example:
        1. mkdir my_folder
        2. cd my_folder
        3. touch file1.txt
        4. cd ..`;
  }

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
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith("#") &&
          !line.startsWith("```")
      );

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
      // Ask user if they want to execute commands in a single session (maintains directory state)
      // or one by one (each command in separate shell)
      const { singleSession } = await inquirer.prompt([
        {
          type: "confirm",
          name: "singleSession",
          message: "Execute commands in a single session? (maintains directory state, recommended): ",
          default: true,
        },
      ]);

      if (singleSession) {
        // Execute all commands in a single shell session to maintain directory state
        await execCommandsInSession(commands, isWindows);
      } else {
        // Execute commands one by one (legacy behavior - each command in separate shell)
        for (const cmd of commands) {
          console.log(chalk.cyan(`Executing: ${cmd}`));
          try {
            await execCommand(cmd, isWindows);
            console.log(chalk.green("✓ Command executed successfully\n"));
          } catch (error) {
            // Beautify error message
            console.log(chalk.red(`✗ Command failed: ${cmd}`));
            console.log(chalk.gray(`  Error: ${error.message}\n`));
            
            const { continueExec } = await inquirer.prompt([
              {
                type: "confirm",
                name: "continueExec",
                message: "Do you want to continue executing the next commands",
                default: true,
              },
            ]);

            if (!continueExec) {
              console.log(chalk.yellow("Stopping execution..."));
              break;
            }
          }
        }
      }
    } else {
      console.log(chalk.red("No response from Gemini."));
    }
  }
}

/**
 * Executes all commands in a single shell session to maintain directory state
 * This allows directory changes (cd/Set-Location) to persist across commands
 */
async function execCommandsInSession(commands, isWindows) {
  return new Promise((resolve, reject) => {
    const shell = isWindows ? "powershell.exe" : process.env.SHELL || "/bin/bash";
    
    // Join commands with semicolons to execute all commands sequentially
    // This maintains directory state (cd/Set-Location persists)
    // Commands will execute even if previous ones fail (user can see all results)
    const script = commands.join('; ');

    console.log(chalk.blue("\nExecuting all commands in a single session...\n"));
    
    // Show what will be executed
    commands.forEach((cmd, index) => {
      console.log(chalk.cyan(`${index + 1}. ${cmd}`));
    });
    console.log();

    let stderrOutput = "";
    let stdoutOutput = "";

    const args = isWindows 
      ? ["-NoProfile", "-Command", script]
      : ["-c", script];

    const child = spawn(shell, args, {
      shell: false,
      stdio: ["inherit", "pipe", "pipe"] // Capture both stdout and stderr
    });

    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutOutput += output;
      // Display output in real-time
      process.stdout.write(output);
    });

    child.stderr.on("data", (data) => {
      stderrOutput += data.toString();
      // Display stderr in real-time but filter verbose messages
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim() && 
            !line.includes('CategoryInfo') && 
            !line.includes('FullyQualifiedErrorId') &&
            !line.includes('+ CategoryInfo') &&
            !line.includes('+ FullyQualifiedErrorId') &&
            !line.includes('At line:')) {
          process.stderr.write(chalk.red(line + '\n'));
        }
      });
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      console.log();
      // Since we're using semicolons, some commands may fail but we still executed all of them
      // Show a warning if there were errors, but don't treat it as a complete failure
      if (code !== 0) {
        let errorMsg = `Some commands may have failed (exit code: ${code})`;
        if (stderrOutput.trim()) {
          const errorLines = stderrOutput.split('\n').filter(line => line.trim());
          const relevantErrors = errorLines.filter(line => 
            !line.includes('CategoryInfo') && 
            !line.includes('FullyQualifiedErrorId') &&
            !line.includes('+ CategoryInfo') &&
            !line.includes('+ FullyQualifiedErrorId') &&
            !line.includes('At line:') &&
            line.trim().length > 0
          );
          if (relevantErrors.length > 0) {
            errorMsg = relevantErrors[0].trim();
          }
        }
        console.log(chalk.yellow(`⚠ Script execution completed with some errors`));
        console.log(chalk.gray(`  ${errorMsg}\n`));
        // Resolve instead of reject - we still executed all commands
        resolve();
      } else {
        console.log(chalk.green("✓ All commands executed successfully\n"));
        resolve();
      }
    });
  });
}

//TODO:Some CLI commands like npx create-next-app@latest might have their own CLI.
//TODO:Spawn allows interactive commands to work properly
//TODO:Learn about spawn processes
function execCommand(command, isWindows) {
  return new Promise((resolve, reject) => {
    // Choose shell explicitly so platform-specific commands work:
    // - On Windows, prefer PowerShell so cmdlets like Test-Path / New-Item work.
    // - On *nix, default to /bin/bash (or user shell if provided).
    const shell =
      isWindows
        ? "powershell.exe"
        : process.env.SHELL || "/bin/bash";

    // For Windows PowerShell, we need to use -Command flag with proper quoting
    // For Unix shells, we use -c flag
    const args = isWindows 
      ? ["-NoProfile", "-Command", command]
      : ["-c", command];

    // Capture stderr separately to hide verbose error messages
    let stderrOutput = "";
    
    const child = spawn(
      shell,
      args,
      { 
        shell: false, // We're already specifying the shell
        stdio: ["inherit", "inherit", "pipe"] // Capture stderr separately, inherit stdin/stdout
      }
    );

    // Collect stderr but don't display it (we'll show a cleaner error message)
    child.stderr.on("data", (data) => {
      stderrOutput += data.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    //when process exits, check its exit code
    child.on("exit", (code) => {
      if (code !== 0) {
        //status code 0 represents that everything is fine
        //in this case != 0 -> so not fine
        // Extract a cleaner error message from stderr if available
        let errorMsg = `Command exited with code ${code}`;
        if (stderrOutput.trim()) {
          // Try to extract the most relevant error line
          const errorLines = stderrOutput.split('\n').filter(line => line.trim());
          // Look for lines that don't contain verbose PowerShell metadata
          const relevantErrors = errorLines.filter(line => 
            !line.includes('CategoryInfo') && 
            !line.includes('FullyQualifiedErrorId') &&
            !line.includes('+ CategoryInfo') &&
            !line.includes('+ FullyQualifiedErrorId') &&
            !line.includes('At line:') &&
            line.trim().length > 0
          );
          if (relevantErrors.length > 0) {
            errorMsg = relevantErrors[0].trim();
          } else if (errorLines.length > 0) {
            errorMsg = errorLines[0].trim();
          }
        }
        reject(new Error(errorMsg));
      } else {
        resolve();
      }
    });
  });
}
