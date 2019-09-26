const path = require('path');
const fs = require('fs').promises;

const CURRENT_DIR = process.cwd();

/**
 * Generates a DiscordJS project. If framework is enabled, it will set the framework
 * key in djs.json to "commando". 
 */
module.exports.generateProject = function(type, projectName, usingFramework, configObj) {
    if(type === 'djs') {
        let opts = usingFramework ? { project: projectName, framework: true, groups: [] } : { project: projectName, framework: false }
        fs.mkdir(path.join(CURRENT_DIR, projectName))
        .then(() => fs.mkdir(path.join(CURRENT_DIR, projectName, 'config'))) // Create Config Folder.
        .then(() => usingFramework ? fs.copyFile(path.join(__dirname, '..', 'templates', 'registry.js'), path.join(CURRENT_DIR, projectName, 'config', 'registry.js')) : Promise.resolve())
        .then(() => usingFramework ? fs.copyFile(path.join(__dirname, '..', 'templates', 'commando.js'), path.join(CURRENT_DIR, projectName, 'bot.js')) : fs.copyFile(path.join(__dirname, '..', 'templates', 'bot.js'), path.join(CURRENT_DIR, projectName, 'bot.js')))
        .then(() => fs.writeFile(path.join(CURRENT_DIR, projectName, 'config', 'config.json'), JSON.stringify(configObj, null, 4)))
        .then(() => fs.writeFile(path.join(CURRENT_DIR, projectName, 'djs.json'), JSON.stringify(opts, null, 4)))
        .then(() => fs.readFile(path.join(CURRENT_DIR, projectName, 'djs.json')))
        .then(() => usingFramework ? fs.mkdir(path.join(CURRENT_DIR, projectName, 'commands')) : Promise.resolve())
        .then(() => console.log("Generated Discord.JS Project"))
        .catch(err => console.log(err));
    }
}

module.exports.exists = async function(filename) {
    let file = path.join(CURRENT_DIR, filename);
    try {
        const res = await fs.access(file);
        return Promise.resolve(true); // Resolve true if project directory exists.
    }
    catch(err) {
        // If fs.access throws an err, that means file doesn't exist.
        return Promise.resolve(false); // Resolve false if project directory doesn't exist.
    }
}

module.exports.readFile = async function(file) {
    return await fs.readFile(path.join(CURRENT_DIR, file), 'utf8');
}

module.exports.generateCommandTemplate = async function(projectName, options) {
    const template = 
    `const commando = require('discord.js-commando');
module.exports = class ${options.name}Command extends commando.Command {
    constructor(client) {
        super(client, {
            name: '${options.name}',
            description: '${options.description}',
            group: '${options.group}',
            memberName: '${options.memberName}'
        })
    }
    async run(msg) {
        msg.channel.send("${options.name} command works!");
    }
}`
    // First check if the group directory exists.
    let doesExist = await this.exists(path.join('commands', `${options.group}`));
    if(doesExist) {
        let cmdExist = await this.exists(path.join('commands', `${options.group}`, `${options.name}Command.js`));
        if(!cmdExist) {
            await fs.writeFile(path.join(CURRENT_DIR, 'commands', `${options.group}`, `${options.name}Command.js`), template);
        } else {
            throw new Error("Command already exists under that group.");
        }
    }
    else {
        await fs.mkdir(path.join(CURRENT_DIR, 'commands', `${options.group}`));
        await fs.writeFile(path.join(CURRENT_DIR, 'commands', `${options.group}`, `${options.name}Command.js`), template);
    }
}