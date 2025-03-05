import chalk from "chalk";
import { exec } from "child_process";
import { fetchLatestVersion } from "../display.js";
import { removeApiKey } from "../config.js";

export async function updatePackage(){

    console.log(chalk.blue("Checking for updates..."));
    removeApiKey();

    try {
        

        const latestVersion = await fetchLatestVersion();

        console.log(chalk.green(`Latest version available: v${latestVersion}`));
        console.log(chalk.blue("Updating shellmancer to the latest version..."));
        exec("npm install -g shellmancer", (error, stdout) => {
            if(error){
                console.error(chalk.red("Update failed: "+error.message));
                return;
            }

            console.log(chalk.green("Update Successful!"));
            console.log(stdout);
        });
    } catch (error) {
        console.error(chalk.red(error));
    }
}