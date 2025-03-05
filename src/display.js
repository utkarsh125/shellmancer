import chalk from "chalk";
import { exec } from 'child_process';
import figlet from "figlet";
import gradient from "gradient-string";

export function displayBanner(){

    figlet('shellmancer', (error, data) => {
        if(error){
            console.error(chalk.red("Error Generating the banner."))
            return;
        }
        console.log(gradient.pastel.multiline(data));
    });

    console.log(chalk.blueBright("Terminal chatbot for the minimalistic experience."));
    console.log(chalk.greenBright("creator: utkarsh125"));
}

export function showHelp(){
    console.log(`\nUsage: shellmancer [command] [options]\n`);
    console.log("Commands:");
    console.log('  explain "<shell command>"      Explain a shell command');
    console.log('  generate-script "<description>" Generate a bash/zsh script');
    console.log("  system-info                     Display system information");
    console.log("  set-model <model>               Set the default Gemini model");
    console.log("  chatbot                       Start interactive chatbot mode");
    console.log("\nOptions:");
    console.log("  --help         Show available commands");
    console.log("  --version      Show version info");
    console.log("  --model        Show the current model");
    console.log("  --remove-api   Remove stored API key");
    console.log("  --update       Update shell-sage to the latest version\n");

}

export function showVersion(){
    fetchLatestVersion()
    .then((fetchLatestVersion) => console.log(`ShellMancerCLI v${latestVersion}`))
    .catch(() => console.log(`ShellMancerCLI (version fetch failed)`));
}

export function showModel(getDefaultModel){
    console.log("Current Model: ", chalk.green(getDefaultModel()));
}

//helperfunc() to fetch version from npm
export function fetchLatestVersion(){
    return new Promise((resolve, reject) => {
        exec("npm show shellmancer version", (error, stdout) => {
            if(error){
                reject("Failed to fetch latest version");
            }
            else{
                resolve(stdout.trim());
            }
        });
    });
}


