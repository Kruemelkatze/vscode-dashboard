"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';

import { Project, FileInfo } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, SAVE_PROJECTS_IN_FILE, PROJECTS_FILE, ADD_NEW_PROJECT_TO_FRONT } from "./constants";

// ~~~~~~~~~~~~~~~~~~~~~~~~~ GET Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function getProjects(context: vscode.ExtensionContext): Project[] {
    if (SAVE_PROJECTS_IN_FILE) {
        return getProjectsFromFile();
    } else {
        return (context.globalState.get("projects") || []) as Project[];
    }
}

function getProjectsFromFile(): Project[] {
    let filePath = `${DATA_ROOT_PATH}/${PROJECTS_FILE}`
    let str = fs.readFileSync(filePath, 'utf8');
    return str ? JSON.parse(str) : [];
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ SAVE Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjects(context: vscode.ExtensionContext, projects: Project[]) {
    if (SAVE_PROJECTS_IN_FILE) {
        return saveProjectsToFile(projects);
    } else {
        context.globalState.update("projects", projects);
        return Promise.resolve();
    }
}

function saveProjectsToFile(projects: Project[]) {
    let data = JSON.stringify(projects);
    let filePath = `${DATA_ROOT_PATH}/${PROJECTS_FILE}`
    return writeTextFile(filePath, data);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ MODIFY Projects ~~~~~~~~~~~~~~~~~~~~~~~~~
export async function addProject(context: vscode.ExtensionContext, project: Project): Promise<Project[]> {
    var projects = getProjects(context);

    if (ADD_NEW_PROJECT_TO_FRONT) {
        projects.unshift(project);
    } else {
        projects.push(project);
    }

    await saveProjects(context, projects);
    return projects;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Project IMAGES ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjectImageFile(fileInfo: FileInfo, project: Project) {
    if (fileInfo == null || project == null)
        return;

    let fileExtension = fileInfo.type.replace(/.+\/(.+)$/, "$1");
    let filePath = `${DATA_ROOT_PATH}/${PROJECT_IMAGE_FOLDER}/${project.id}.${fileExtension}`;
    let data = new Buffer(fileInfo.content);
    return writeFile(filePath, data);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Helpers ~~~~~~~~~~~~~~~~~~~~~~~~~
function writeTextFile(filePath: string, data: string): Promise<void> {
    return writeFile(filePath, data, 'utf8');
}

function writeFile(filePath: string, data: any, encoding: string = undefined): Promise<void> {
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