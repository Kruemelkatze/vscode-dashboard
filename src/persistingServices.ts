"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';

import { Project, FileInfo } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, SAVE_PROJECTS_IN_FILE, PROJECTS_FILE } from "./constants";

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Projects ~~~~~~~~~~~~~~~~~~~~~~~~~
export function getProjects(context: vscode.ExtensionContext): Project[] {
    return (context.globalState.get("projects") || []) as Project[];
}

export function saveProjects(context: vscode.ExtensionContext, projects: Project[]) {
    if (SAVE_PROJECTS_IN_FILE) {
        return saveProjectsToFile(projects);
    } else {
        context.globalState.update("projects", projects);
    }
}

export function saveProjectImageFile(fileInfo: FileInfo, project: Project) {
    if (fileInfo == null || project == null)
        return;

    var fileExtension = fileInfo.type.replace(/.+\/(.+)$/, "$1");
    var filePath = `${DATA_ROOT_PATH}/${PROJECT_IMAGE_FOLDER}/${project.id}.${fileExtension}`;
    var data = new Buffer(fileInfo.content);
    return writeFile(filePath, data);
}

function saveProjectsToFile(projects: Project[]) {
    var data = JSON.stringify(projects);
    var filePath = `${DATA_ROOT_PATH}/${PROJECTS_FILE}`
    return writeTextFile(filePath, data);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Helpers ~~~~~~~~~~~~~~~~~~~~~~~~~
function writeTextFile(filePath: string, data: string) {
    return writeFile(filePath, data, 'utf8');
}

function writeFile(filePath: string, data: any, encoding: string = undefined) {
    filePath = path.normalize(filePath);
    var folder = path.dirname(filePath);

    return new Promise((resolve, reject) => {
        mkdirp(folder, (err) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                try {
                    fs.writeFileSync(filePath, data, encoding);
                    resolve();
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            }
        });
    });
}