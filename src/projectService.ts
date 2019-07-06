"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as vscode from 'vscode';

import { Project, ProjectGroup } from "./models";
import { DATA_ROOT_PATH, ADD_NEW_PROJECT_TO_FRONT } from "./constants";

// ~~~~~~~~~~~~~~~~~~~~~~~~~ GET Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function getProjects(context: vscode.ExtensionContext): ProjectGroup[] {
    return (context.globalState.get("projects") || []) as ProjectGroup[];
}

export function getProjectsFlat(context: vscode.ExtensionContext): Project[] {
    var projectGroups = getProjects(context);
    var projects = [];
    for (let group of projectGroups) {
        projects.push.apply(projects, group.projects);
    }

    return projects;
}

export function getProject(context: vscode.ExtensionContext, projectId: string): Project {
    var [project, group] = getProjectAndGroup(context, projectId);
    return project;
}

export function getProjectAndGroup(context: vscode.ExtensionContext, projectId: string): [Project, ProjectGroup] {
    if (projectId == null) {
        return null;
    }

    var projectGroups = getProjects(context);
    for (let group of projectGroups) {
        let project = group.projects.find(p => p.id === projectId);
        if (project != null) {
            return [project, group];
        }
    }
    return [null, null];
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ SAVE Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjects(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): Thenable<void> {
    return context.globalState.update("projects", projectGroups);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ MODIFY Projects ~~~~~~~~~~~~~~~~~~~~~~~~~
export async function addProjectGroup(context: vscode.ExtensionContext, groupName: string, projects: Project[] = null): Promise<ProjectGroup> {
    var projectGroups = getProjects(context);
    if (projectGroups == null) {
        projectGroups = [];
    }

    let newProjectGroup = new ProjectGroup(groupName, projects);
    projectGroups.push(newProjectGroup);
    await saveProjects(context, projectGroups);
    return newProjectGroup;
}

export async function addProject(context: vscode.ExtensionContext, project: Project, projectGroupId: string): Promise<ProjectGroup[]> {
    // Get project groups, default them to [] if there are no groups
    var projectGroups = getProjects(context);
    if (projectGroups == null) {
        projectGroups = [];
    }

    // Get the project group if there is any
    var projectGroup = projectGroups.find(g => g.id === projectGroupId);

    if (projectGroup == null) {
        if (projectGroups.length) {
            // No group found, but there are groups? Default to first group
            projectGroup = projectGroups[0];
        } else {
            // No groups, create initial group
            projectGroup = new ProjectGroup(null);
            projectGroups.push(projectGroup);
        }
    }

    if (ADD_NEW_PROJECT_TO_FRONT) {
        projectGroup.projects.unshift(project);
    } else {
        projectGroup.projects.push(project);
    }

    saveProjects(context, projectGroups);
    return projectGroups;
}

export async function updateProject(context: vscode.ExtensionContext, projectId: string, updatedProject: Project) {
    if (!projectId || updateProject == null) {
        return;
    }

    var projectGroups = getProjects(context);
    for (let group of projectGroups) {
        let project = group.projects.find(p => p.id === projectId);
        if (project != null) {
            Object.assign(project, updatedProject, { id: projectId });
            break;
        }
    }

    saveProjects(context, projectGroups);
}

export async function removeProject(context: vscode.ExtensionContext, projectId: string): Promise<ProjectGroup[]> {
    let projectGroups = getProjects(context);
    for (let i = 0; i < projectGroups.length; i++) {
        let group = projectGroups[i];
        let index = group.projects.findIndex(p => p.id === projectId);

        if (index !== -1) {
            group.projects.splice(index, 1);
            if (group.projects.length === 0) {
                projectGroups.splice(i, 1);
            }
            break;
        }
    }
    await saveProjects(context, projectGroups);
    return projectGroups;
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

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Model Migration ~~~~~~~~~~~~~~~~~~~~~~~~~
export function migrateDataIfNeeded(context: vscode.ExtensionContext) {
    let migrated = context.globalState.get("MigratedToGroupSchema") === true;

    if (!migrated) {
        var data = context.globalState.get("projects");
        // is data an array containing something?
        if (data != null && data[0]) {
            let element = data[0];
            if (element.path !== undefined && element.name !== undefined) {
                // Project
                // instanceof does not work here, as we are dealing with serialized objects. Maybe there's a better way in TypeScript?
                var groups = updateToGroupSchema(data as Project[]);
                context.globalState.update("projects", groups);
            } else {
                // ProjectGroup --> already migrated
            }
        } else {
            // Default to empty array to be safe
            context.globalState.update("projects", []);
        }

        context.globalState.update("MigratedToGroupSchema", true);
    }

    return !migrated;
}

function updateToGroupSchema(projects: Project[]): ProjectGroup[] {
    if (projects == null) {
        return [];
    }

    let initialGroup = new ProjectGroup("", projects);
    let groups = [initialGroup];
    return groups;
}