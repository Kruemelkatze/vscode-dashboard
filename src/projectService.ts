"use strict";
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { uniqBy, find } from 'lodash';

import * as ntc from './ntc';
import { Project, ProjectGroup } from "./models";
import { ADD_NEW_PROJECT_TO_FRONT, PROJECTS_KEY, RECENT_COLORS_KEY, PREDEFINED_COLORS } from "./constants";

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

// ~~~~~~~~~~~~~~~~~~~~~~~~~ COLORS ~~~~~~~~~~~~~~~~~~~~~~~~~
export function getRecentColors(context: vscode.ExtensionContext): string[][] {
    return useSettingsStorage() ? getColorsFromSettings(context) : getColorsFromGlobalState(context);
}

export function addRecentColor(context: vscode.ExtensionContext, colorCode: string) {
    if (!colorCode) {
        return;
    }

    // Get a name for the color, if possible (hex, rgb or rgba);
    var colorName = getColorName(colorCode);
    var colorDef = [colorCode, colorName];

    var colors = getRecentColors(context);
    colors.unshift(colorDef);

    // Remove duplicate names (except empty entries)
    colors = uniqBy(colors, d => d[1] || Math.random());

    var maxColorCount = vscode.workspace.getConfiguration('dashboard').get('recentColorsToRemember') as number;
    colors = colors.slice(0, maxColorCount);

    if (useSettingsStorage()) {
        return saveColorsInSettings(context, colors);
    } else {
        return saveColorsInGlobalState(context, colors);
    }
}

export function getColorName(colorCode: string) {
    try {
        if (colorCode) {
            var predefColor = find(PREDEFINED_COLORS, c => c.value === colorCode);
            if (predefColor) {
                return predefColor.label;
            }
        }

        var colorHex = colorStringToHex(colorCode);
        var colorName = null;;

        if (colorHex) {
            var colorMatch = ntc.default.name(colorCode);
            colorName = colorMatch[1] && !colorMatch[1].includes(':') ? colorMatch[1] : null;
        }

        return colorName;
    } catch (e) {
        return null;
    }
}

export function getRandomColor(predefinedOnly: false = false) {
    if (predefinedOnly) {
        let predefColor = PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
        return predefColor.value;
    }

    var randomColorEntry = ntc.default.random();
    return "#" + randomColorEntry[0];
}

function colorStringToHex(colorString: string) {
    if (!colorString) {
        return null;
    }

    colorString = colorString.trim();

    if (colorString[0] === '#') {
        return colorString.substr(0, 7);
    }

    if (/rgba?\(/.test(colorString)) {
        try {
            return rgbToHex(colorString);
        } catch (e) {
            return null;
        }
    }

    return null;
}

function rgbToHex(rgb: string): string {
    // Credits to https://css-tricks.com/converting-color-spaces-in-javascript/

    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    let leftParenthesis = rgb.indexOf("(");
    // Turn "rgb(r,g,b)" into [r,g,b]
    var split = rgb.substr(leftParenthesis + 1).split(")")[0].split(sep);

    let r = (+split[0]).toString(16),
        g = (+split[1]).toString(16),
        b = (+split[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
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

    // Add to recent colors
    try {
        await addRecentColor(context, project.color);
    } catch (e) {
        console.error(e);
    }

    await saveProjectGroups(context, projectGroups);
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


    // Add to recent colors
    try {
        await addRecentColor(context, updatedProject.color);
    } catch (e) {
        console.error(e);
    }
    await saveProjectGroups(context, projectGroups);
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

    await saveProjectGroups(context, projectGroups);
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
    var projectGroups = context.globalState.get(PROJECTS_KEY) as ProjectGroup[];

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
    return context.globalState.update(PROJECTS_KEY, projectGroups);
}

function saveProjectGroupsInSettings(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): Thenable<void> {
    var config = vscode.workspace.getConfiguration('dashboard');
    return config.update("projectData", projectGroups, vscode.ConfigurationTarget.Global);
}

function getColorsFromGlobalState(context: vscode.ExtensionContext): string[][] {
    return context.globalState.get(RECENT_COLORS_KEY) as string[][] || [];
}

function getColorsFromSettings(context: vscode.ExtensionContext): string[][] {
    return vscode.workspace.getConfiguration('dashboard').get(RECENT_COLORS_KEY) as string[][] || [];
}

function saveColorsInGlobalState(context: vscode.ExtensionContext, colors: string[][]): Thenable<void> {
    return context.globalState.update(RECENT_COLORS_KEY, colors);
}

function saveColorsInSettings(context: vscode.ExtensionContext, colors: string[][]): Thenable<void> {
    var config = vscode.workspace.getConfiguration('dashboard');
    return config.update(RECENT_COLORS_KEY, colors, vscode.ConfigurationTarget.Global);
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