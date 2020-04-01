"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { Project, ProjectGroup } from "./models";
import { ADD_NEW_PROJECT_TO_FRONT } from "./constants";

function useSettingsStorage(): boolean {
    return vscode.workspace.getConfiguration('dashboard').get('storeProjectsInSettings');
}

function sanitizeProjectGroups(projectGroups: ProjectGroup[]): ProjectGroup[] {
    let groups = Array.isArray(projectGroups) ? projectGroups : [];

    // Fill id, should only happen if user removes id manually. But better be safe than sorry.
    for (let g of groups) {
        if (!g.id) {
            g.id = ProjectGroup.getRandomId();
        }
    }

    return groups;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ GET Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function getProjects(context: vscode.ExtensionContext, noSanitize = false): ProjectGroup[] {
    var groups = useSettingsStorage() ?
        getProjectsFromSettings(context) :
        getProjectsFromGlobalState(context);

    if (!noSanitize) {
        groups = sanitizeProjectGroups(groups);
    }

    return groups;
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

export function getProjectsGroup(context: vscode.ExtensionContext, projectGroupId: string): ProjectGroup {
    var projects = getProjects(context);
    return projects.find(g => g.id === projectGroupId) || null;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ SAVE Projects ~~~~~~~~~~~~~~~~~~~~~~~~~

export function saveProjectGroups(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): Thenable<void> {
    projectGroups = sanitizeProjectGroups(projectGroups);


    if (useSettingsStorage()) {
        return saveProjectGroupsInSettings(context, projectGroups);
    } else {
        return saveProjectGroupsInGlobalState(context, projectGroups);
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ MODIFY Projects ~~~~~~~~~~~~~~~~~~~~~~~~~
export async function addProjectGroup(context: vscode.ExtensionContext, groupName: string, projects: Project[] = null): Promise<ProjectGroup> {
    var projectGroups = getProjects(context);
    if (projectGroups == null) {
        projectGroups = [];
    }

    let newProjectGroup = new ProjectGroup(groupName, projects);
    projectGroups.push(newProjectGroup);
    await saveProjectGroups(context, projectGroups);
    return newProjectGroup;
}

export async function addProject(context: vscode.ExtensionContext, project: Project, projectGroupId: string): Promise<ProjectGroup[]> {
    // Get project groups, default them to [] if there are no groups
    var projectGroups = getProjects(context, true);
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

    saveProjectGroups(context, projectGroups);
    return projectGroups;
}

export async function updateProject(context: vscode.ExtensionContext, projectId: string, updatedProject: Project) {
    if (!projectId || updatedProject == null) {
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

    saveProjectGroups(context, projectGroups);
}

export async function updateProjectGroup(context: vscode.ExtensionContext, projectsGroupId: string, updatedProjectGroup: ProjectGroup) {
    if (!projectsGroupId || updatedProjectGroup == null) {
        return;
    }

    var projectGroups = getProjects(context);
    var group = projectGroups.find(g => g.id === projectsGroupId);
    if (group != null) {
        Object.assign(group, updatedProjectGroup, { id: projectsGroupId });
    }

    saveProjectGroups(context, projectGroups);
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
    await saveProjectGroups(context, projectGroups);
    return projectGroups;
}

export async function removeProjectsGroup(context: vscode.ExtensionContext, projectsGroupId: string): Promise<ProjectGroup[]> {
    let projectGroups = getProjects(context);

    projectGroups = projectGroups.filter(g => g.id !== projectsGroupId);
    await saveProjectGroups(context, projectGroups);

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

export function writeTextFile(filePath: string, data: string) {
    writeFile(filePath, data, 'utf8');
}

function writeFile(filePath: string, data: any, encoding: string = undefined) {
    filePath = path.normalize(filePath);

    var dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    fs.writeFileSync(filePath, data, encoding);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ STORAGE ~~~~~~~~~~~~~~~~~~~~~~~~~
function getProjectsFromGlobalState(context: vscode.ExtensionContext, unsafe: boolean = false): ProjectGroup[] {
    var projectGroups = context.globalState.get("projects") as ProjectGroup[];

    if (projectGroups == null && !unsafe) {
        projectGroups = [];
    }

    return projectGroups;
}

function getProjectsFromSettings(context: vscode.ExtensionContext, unsafe: boolean = false): ProjectGroup[] {
    var projectGroups = vscode.workspace.getConfiguration('dashboard').get('projectData') as ProjectGroup[];

    if (projectGroups == null && !unsafe) {
        projectGroups = [];
    }

    return projectGroups;
}

function saveProjectGroupsInGlobalState(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): Thenable<void> {
    return context.globalState.update("projects", projectGroups);
}

function saveProjectGroupsInSettings(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): Thenable<void> {
    var config = vscode.workspace.getConfiguration('dashboard');
    return config.update("projectData", projectGroups, vscode.ConfigurationTarget.Global);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Model Migration ~~~~~~~~~~~~~~~~~~~~~~~~~
export async function migrateDataIfNeeded(context: vscode.ExtensionContext) {
    var toMigrate = false;

    var projectsInSettings = getProjectsFromSettings(context, true);
    var projectsInGlobalState = getProjectsFromGlobalState(context, true);

    if (useSettingsStorage()) {
        // Migrate from Global State to Settings
        toMigrate = projectsInSettings == null && projectsInGlobalState != null;

        if (toMigrate) {
            await saveProjectGroupsInSettings(context, projectsInGlobalState);
            await saveProjectGroupsInGlobalState(context, null);
        }
    } else {
        // Migrate from Settings To Global State
        toMigrate = projectsInGlobalState == null && projectsInSettings != null;

        if (toMigrate) {
            await saveProjectGroupsInGlobalState(context, projectsInSettings);
            await saveProjectGroupsInSettings(context, null);
        }
    }

    return toMigrate;
}