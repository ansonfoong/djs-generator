const path = require('path');
const fs = require('fs').promises;
const templates = require(path.join(__dirname, 'Templates'));
const CURRENT_DIR = process.cwd();

/**
 * Generates a DiscordJS project. If framework is enabled, it will set the framework
 * key in djs.json to "commando". 
 */
module.exports.generateProject = function(type, projectName, usingFramework, configObj) {
    if(type === 'djs') {
        let opts = usingFramework ? { project: projectName, framework: true, groups: [] } : { project: projectName, framework: false, groups: [] }
        fs.mkdir(path.join(CURRENT_DIR, projectName))
        .then(() => fs.mkdir(path.join(CURRENT_DIR, projectName, 'config'))) // Create Config Folder.
        .then(() => fs.writeFile(path.join(CURRENT_DIR, projectName, 'config', 'config.json'), JSON.stringify(configObj, null, 4)))
        .then(() => fs.writeFile(path.join(CURRENT_DIR, projectName, 'djs.json'), JSON.stringify(opts, null, 4)))
        .then(() => fs.mkdir(path.join(CURRENT_DIR, projectName, 'commands'))) // Generate Commands Folder for both Scaffolds.
        .then(() =>  fs.mkdir(path.join(CURRENT_DIR, projectName, 'events'))) // Generate Events Folder for both Scaffolds.
        .then(() => copyTemplates({ usingFramework: usingFramework, projectName: projectName}))
        .then(() => console.log("Generated Discord.JS Project"))
        .catch(err => console.log(err));
    }
}

async function copyTemplates(opts) {

    try {
        await fs.copyFile(path.join(__dirname, '..', 'templates', 'ready.js'), path.join(CURRENT_DIR, opts.projectName, 'events', 'ready.js'));
        await fs.copyFile(path.join(__dirname, '..', 'templates', 'message.js'), path.join(CURRENT_DIR, opts.projectName, 'events', 'message.js'));
        opts.usingFramework ? await fs.copyFile(path.join(__dirname, '..', 'templates', 'registry.js'), path.join(CURRENT_DIR, opts.projectName, 'config', 'registry.js')) : await fs.copyFile(path.join(__dirname, '..', 'templates', 'mainregistry.js'), path.join(CURRENT_DIR, opts.projectName, 'config', 'registry.js'));
        opts.usingFramework ? fs.copyFile(path.join(__dirname, '..', 'templates', 'commando.js'), path.join(CURRENT_DIR, opts.projectName, 'bot.js')) : fs.copyFile(path.join(__dirname, '..', 'templates', 'bot.js'), path.join(CURRENT_DIR, opts.projectName, 'bot.js'));
        await fs.copyFile(path.join(__dirname, '..', 'templates', 'sample_commands', 'test.js'), path.join(CURRENT_DIR, opts.projectName, 'commands', 'test.js'));
        console.log("Copied templates...");
    }
    catch(err) {
        console.log(err);
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
    const template = templates.generateCommand(options);
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

    let obj = JSON.parse(await this.readFile('djs.json'));
    
    if(obj.groups.some(el => el[0] === `${options.group}`)) {
        console.log("Group already registered.");
    }
    else {
        obj.groups.push([`${options.group}`, `${options.group} commands`]);
        await fs.writeFile(path.join(CURRENT_DIR, 'djs.json'), JSON.stringify(obj, null, 4));
    }
}