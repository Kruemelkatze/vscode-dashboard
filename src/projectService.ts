"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';

import { Project } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, SAVE_PROJECTS_IN_FILE, PROJECTS_FILE, ADD_NEW_PROJECT_TO_FRONT } from "./constants";

// ~~~~~~~~~~~~~~~~~~~~~~~~~ GET Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function loadProjects(context: vscode.ExtensionContext): Project[] {
    if (SAVE_PROJECTS_IN_FILE) {
        return loadProjectsFromFile();
    } else {
        return (context.globalState.get("projects") || []) as Project[];
    }
}

function loadProjectsFromFile(): Project[] {
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
    var projects = loadProjects(context);

    if (ADD_NEW_PROJECT_TO_FRONT) {
        projects.unshift(project);
    } else {
        projects.push(project);
    }

    await saveProjects(context, projects);
    return projects;
}

export async function removeProject(context: vscode.ExtensionContext, id: string): Promise<Project[]> {
    let projects = loadProjects(context);
    projects = projects.filter(p => p.id !== id);
    await saveProjects(context, projects);
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