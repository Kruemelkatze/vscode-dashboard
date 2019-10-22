'use strict';

import * as vscode from 'vscode';
import { SSH_REMOTE_PREFIX } from "./constants";

export class ProjectGroup {
    id: string;
    groupName: string;
    projects: Project[];

    constructor(groupName: string, projects: Project[] = null) {
        this.id = generateRandomId(groupName);
        this.groupName = groupName;
        this.projects = projects || [];
    }
}

export class Project {
    id: string;
    name: string;
    path: string;
    color: string;
    isGitRepo = false;

    constructor(name: string, path: string) {
        this.id = generateRandomId(name);
        this.name = name;
        this.path = path;
    }

    getRemoteType() : ProjectRemoteType {
        if (this.path && this.path.startsWith(SSH_REMOTE_PREFIX)){
            return ProjectRemoteType.SSH;
        }

        return ProjectRemoteType.None;
    }
}

export function getRemoteType(project: Project): ProjectRemoteType {
    return Project.prototype.getRemoteType.call(project);
}

function generateRandomId(prepend: string = null) {
    if (prepend) {
        prepend = prepend.replace(/\W/ig, "").toLowerCase().substring(0, 24);
    } else {
        prepend = '';
    }

    return prepend + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export interface GroupOrder {
    groupId: string;
    projectIds: string[];
}

export interface DashboardInfos {
    relevantExtensionsInstalls: { remoteSSH },
    config: vscode.WorkspaceConfiguration,
}

export enum ProjectRemoteType {
    None,
    SSH,
}