#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash')
    moduleNameToIncrement = '',
    dir = process.cwd();

if (process.argv.length >= 3) {
    moduleNameToIncrement = process.argv[2];
} else {
    return;
}

function forEach(list, callback) {
    for (var i = 0; i < list.length; i++) {
        callback(list[i], i);
    }
}

function extractVersionParameters(version) {
    var versions,
        versionParameters = {},
        regexp = new RegExp('(\\d*)');

    versions = version.split('.');

    versionParameters.major = versions.length > 0 ? regexp.exec(versions[0])[0] : '0';
    versionParameters.minor = versions.length > 1 ? regexp.exec(versions[1])[0] : '0';
    versionParameters.patch = versions.length > 2 ? regexp.exec(versions[2])[0] : '0';

    versionParameters.toString = function () {
        return `${this.major}.${this.minor}.${this.patch}`;
    };

    return versionParameters;
};

function processVersion(version) {
    var versionParameters,
        operation = 'patch';
    if (process.argv.length >= 4) {
        operation = process.argv[3];
    }

    switch(operation) {
        case 'major':
            versionParameters = extractVersionParameters(version);
            versionParameters.major = parseInt(versionParameters.major) + 1;
            versionParameters.minor = 0;
            versionParameters.patch = 0;
            break;
        case 'minor':
            versionParameters = extractVersionParameters(version);
            versionParameters.minor = parseInt(versionParameters.minor) + 1;
            versionParameters.patch = 0;
            break;
        case 'patch':
            versionParameters = extractVersionParameters(version);
            versionParameters.patch = parseInt(versionParameters.patch) + 1;
            break;
        default:
            return operation;
    }

    return versionParameters.toString();
}

var list = [],
    modules = {};

list.forEach = function (callback) { forEach(this, callback); };

function processModule(parentFolderName, directory) {
    var jsonPath = path.join(directory, 'package.json'),
        jsonObject = require(jsonPath),
        object = { json : jsonObject, jsonPath : jsonPath };
    list.push(object);
    modules[parentFolderName].submodules[jsonObject.name] = object;
}

function readDir(directory, recursive, name) {
    var hasPackageJson = fs.existsSync(path.join(directory, 'package.json'));
    if (hasPackageJson) {
        if (!modules[name]) {
            modules[name] = { submodules : {} };
        }
        processModule(name, directory);
    } else if (recursive) {
        fs.readdirSync(directory).filter(file => /^[a-z|-]*$/.test(file))
            .forEach(file => {
                var stats = fs.statSync(path.join(directory, file));
                if (stats.isDirectory()) {
                    var moduleName = directory == dir ? file : name;
                    readDir(path.join(directory, file), directory == dir, moduleName);
                }
            });
    }
}
readDir(dir, true);

var modulesUpdated = [];
_.forEach(modules, (item, moduleName) => {
    if (moduleName == moduleNameToIncrement) {
        _.forEach(item.submodules, subitem => {
            modulesUpdated.push(subitem);
            subitem.dirty = true;
            subitem.json.version = processVersion(subitem.json.version);
            console.log(`└─ ${subitem.json.name}@${subitem.json.version}`);
        });
    }
});

modulesUpdated.forEach(item => {
    var moduleName = item.json.name,
        version = item.json.version;
    list.forEach(otherItem => {
        if (otherItem.json.dependencies && otherItem.json.dependencies.hasOwnProperty(moduleName)
            && otherItem.json.dependencies[moduleName] != '*') {
            otherItem.json.dependencies[moduleName] = `^${version}`;
            otherItem.dirty = true;
        }
        if (otherItem.json.devDependencies && otherItem.json.devDependencies.hasOwnProperty(moduleName)
            && otherItem.json.devDependencies[moduleName] != '*') {
            otherItem.json.devDependencies[moduleName] = `^${version}`;
            otherItem.dirty = true;
        }
    });
});

list.forEach(item => {
    if (item.dirty) {
        console.log(`Changing file content: ${item.jsonPath}`);
        fs.writeFileSync(item.jsonPath, JSON.stringify(item.json, null, 2));
    }
});