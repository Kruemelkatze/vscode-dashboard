"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';

import { Project } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, PROJECTS_FILE, ADD_NEW_PROJECT_TO_FRONT } from "./constants";

// ~~~~~~~~~~~~~~~~~~~~~~~~~ GET Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function getProjects(context: vscode.ExtensionContext): Project[] {
    return (context.globalState.get("projects") || []) as Project[];
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ SAVE Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjects(context: vscode.ExtensionContext, projects: Project[]): Thenable<void> {
    return context.globalState.update("projects", projects);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ MODIFY Projects ~~~~~~~~~~~~~~~~~~~~~~~~~
export async function addProject(context: vscode.ExtensionContext, project: Project): Promise<Project[]> {
    var projects = getProjects(context);

    if (ADD_NEW_PROJECT_TO_FRONT) {
        projects.unshift(project);
    } else {
        projects.push(project);
    }

    saveProjects(context, projects);
    return projects;
}

export async function removeProject(context: vscode.ExtensionContext, id: string): Promise<Project[]> {
    let projects = getProjects(context);
    projects = projects.filter(p => p.id !== id);
    saveProjects(context, projects);
    return projects;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Project IMAGES ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjectImageFile(filePath: string, project: Project): Promise<void> {
    if (!filePath || project == null)
        return;

    var sourcePath = path.normalize(filePath);

    var fileExtension = path.extname(sourcePath);
    var targetPath = path.normalize(`${DATA_ROOT_PATH}/${PROJECT_IMAGE_FOLDER}/${project.id}${fileExtension}`);
    var targetFolder = path.dirname(targetPath);

    return new Promise((resolve, reject) => {
        mkdirp(targetFolder, (err) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                try {
                    fs.copyFileSync(sourcePath, targetPath);
                    resolve();
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            }
        })
    });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Helpers ~~~~~~~~~~~~~~~~~~~~~~~~~
export function deleteFile(filePath: string) {
    filePath = path.normalize(filePath);
    //Promise to keep all file modifications returning a Promise
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, err => {
            err ? reject(err) : resolve();
        });
    });
}

export function writeTextFile(filePath: string, data: string): Promise<void> {
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