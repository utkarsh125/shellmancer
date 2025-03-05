// This module will handle
// Reading and Writing your configuration
// API Key, Default Model, etc

import chalk from 'chalk';
import fs from 'fs';
import inquirer from "inquirer";
import os from 'os';
import path from 'path';

const configFilePath = path.join(os.homedir(), ".shell-sage-config.json");
const FALLBACK_MODEL = "gemini-2.0-flash"; //Current model that works will be used as fallback

export function loadConfig(){

    if(fs.existsSync(configFilePath)){
        try {
            
            const data = fs.readFileSync(configFilePath, 'utf-8')
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading configFile: ", error.message);
            return {};            
        }


    } else {

        return {};
    }
}

export function saveConfig(config) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to configFile: ", error.message);
    }
}


export async function getApiKey(){
    const config = loadConfig();
    if(!config.apiKey){
        const { apiKey } = await inquirer.prompt([

            {
                type: "input",
                "name": "apiKey",
                "message": "Enter your GeminiAPI Key: ",
                validate: (input) => (input ? true: "API Key cannot be empty"),
            },
        ]);
        config.apiKey = apiKey;
        saveConfig(config);
        return apiKey;
    }
    return config.apiKey;
}

export async function removeApiKey(){

    const config = loadConfig();

    if(config.apiKey){
        delete config.apiKey;
        saveConfig(config);
        console.log(chalk.redBright("API key removed from config."));
    }else{
        console.log(chalk.yellowBright("No stored API key found in config."))
    }
}

export function getDefaultModel(){

    const config = loadConfig();

    //if model is defined properly then return it
    //if no model is specified then return the FALLBACK_MODEL (gemini-2.0-flash)
    return config.getDefaultModel || FALLBACK_MODEL;
}

export function setDefaultModel(newModel){
    const config = loadConfig();
    config.getDefaultModel = newModel;
    saveConfig(config);
    console.log(chalk.blue("Default model is set to: "), newModel);
}