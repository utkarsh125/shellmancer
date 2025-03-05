import chalk from "chalk";
import os from "os";

export function systemInfo(){
    console.log(chalk.green("System Information:"));
    console.log("OS:", os.type(), os.platform(), os.arch(), os.release());
    console.log("Total Memory:", (os.totalmem() / (1024 ** 3)).toFixed(2), "GB");
    console.log("Free Memory:", (os.freemem() / (1024 ** 3)).toFixed(2), "GB");
    const cpus = os.cpus();
    console.log("CPU(s):", cpus[0].model, "x", cpus.length);
}