import * as vscode from 'vscode';
import * as path from 'path';

import { Project, ProjectGroup, getRemoteType, ProjectRemoteType, DashboardInfos } from "../models";
import { FITTY_OPTIONS, REMOTE_REGEX } from '../constants';
import * as Icons from './webviewIcons';

export function getDashboardContent(context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, projectGroups: ProjectGroup[], infos: DashboardInfos): string {
    var stylesPath = getMediaResource(context, webviewPanel, 'styles.css');
    var fittyPath = getMediaResource(context, webviewPanel, 'fitty.min.js');
    var dragulaPath = getMediaResource(context, webviewPanel, 'dragula.min.js');

    var projectScriptsPath = getMediaResource(context, webviewPanel, 'webviewProjectScripts.js');
    var dndScriptsPath = getMediaResource(context, webviewPanel, 'webviewDnDScripts.js');

    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; script-src ${webviewPanel.webview.cspSource} 'unsafe-inline'; style-src ${webviewPanel.webview.cspSource} 'unsafe-inline';"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${stylesPath}">
        <title>Dashboard</title>
        ${getCustomStyle(infos.config)}
    </head>
    <body class="preload ${!projectGroups.length ? 'dashboard-empty' : ''}">
        <div class="">
            <div class="projects-wrapper ${!infos.config.displayProjectPath ? 'hide-project-path' : ''}">
        ${projectGroups.length ?
            projectGroups.map(group => getProjectGroupSection(group, projectGroups.length, infos)).join('\n')
            :
            getNoProjectsDiv()
        }
            </div>

            ${getTempProjectGroupSection(projectGroups.length)}
        </div>
    </body>

    <script src="${fittyPath}"></script>
    <script src="${dragulaPath}"></script>
    <script src="${projectScriptsPath}"></script>
    <script src="${dndScriptsPath}"></script>

    <script>
        (function() {
            fitty('.project-header', ${JSON.stringify(FITTY_OPTIONS)});

            window.vscode = acquireVsCodeApi();      
            
            window.onload = () => {
                initProjects();
                initDnD();
            }
        })();
    </script>


</html>`;
}

function getProjectGroupSection(projectGroup: ProjectGroup, totalGroupCount: number, infos: DashboardInfos) {
    // Apply changes to HTML here also to getTempProjectGroupSection

    var showAddButton = infos.config.showAddProjectButtonTile;

    return `
<div class="projects-group ${projectGroup.collapsed ? 'collapsed' : ''} ${projectGroup.projects.length === 0 ? 'no-projects' : ''}" data-group-id="${projectGroup.id}">
    <div class="projects-group-title">
        <span class="project-group-title-text" data-action="collapse" data-drag-group>
            <span class="collapse-icon" title="Open/Collapse Project Group">${Icons.collapse}</span>
            ${projectGroup.groupName || "Unnamed Project Group"}
        </span>
        <div class="projects-group-actions right">
            <span data-action="add" title="Add Project">${Icons.add}</span>
        </div>
        <div class="projects-group-actions left">
            <!-- <span data-action="drag">${Icons.drag}</span> -->
            <span data-action="edit" title="Edit Project Group">${Icons.edit}</span>
            <span data-action="delete" title="Remove Project Group">${Icons.remove}</span>
        </div>
    </div>
    <div class="projects-group-list">
        <div class="drop-signal"></div>
        ${projectGroup.projects.map(p => getProjectDiv(p, infos)).join('\n')}
        ${showAddButton ? getAddProjectDiv(projectGroup.id) : ""}
    </div>       
</div>`;
}

function getTempProjectGroupSection(totalGroupCount: number) {
    return `
<div class="projects-group" id="tempGroup">
    <div class="projects-group-title" data-action="add-projects-group">
        <span>${Icons.add} New Project Group</span>
    </div>
    <div class="projects-group-list">
        <div class="drop-signal"></div>
    </div>       
</div>     
    </div>       
</div>`;
}

function getProjectDiv(project: Project, infos: DashboardInfos) {
    var borderStyle = `background: ${project.color};`
    var remoteType = getRemoteType(project);
    var trimmedPath = (project.path || '').replace(REMOTE_REGEX, '');

    var isRemote = remoteType !== ProjectRemoteType.None;
    var remoteExError = isRemote && !infos.relevantExtensionsInstalls.remoteSSH;

    return `
<div class="project-container">
    <div class="project" data-id="${project.id}">
        <div class="project-border" style="${borderStyle}"></div>
        <div class="project-actions-wrapper">
            <div class="project-actions">
                <span data-action="color" title="Edit Color">${Icons.palette}</span>
                <span data-action="edit" title="Edit Project">${Icons.edit}</span>
                <span data-action="delete" title="Remove Project">${Icons.remove}</span>
            </div>
        </div>
        <div class="fitty-container">
            <h2 class="project-header">
                ${project.name}
            </h2>
        </div>
        <p class="project-path-info">
            ${isRemote ? `<span class="remote-icon ${remoteExError ? 'error-icon' : ''}" title="${remoteExError ? 'Remote Development extension is not installed' : 'Remote Project'}">${Icons.remote}</span>` : ''}
            ${project.isGitRepo ? `<span class="git-icon" title="Git Repository">${Icons.gitSvg}</span>` : ''}
            <span class="project-path" title="${trimmedPath}">${trimmedPath}</span>
        </p>
    </div>
</div>`
}

function getNoProjectsDiv() {
    return `
<div class="project-container">
    <div class="project no-projects" data-action="add-project">
        No projects have been added yet.
        <br/>
        Click here to add one.
    </div>
</div>`
}

function getAddProjectDiv(projectGroupId: string) {
    return `
<span class="project-container slim last" data-nodrag>
    <div class="project add-project" data-action="add-project" data-project-group-id="${projectGroupId}">
        <h2 class="add-project-header">
            +
        </h2>
    </div>
</span>`
}

function getCustomStyle(config: vscode.WorkspaceConfiguration) {
    var { customProjectCardBackground, customProjectNameColor, customProjectPathColor, projectTileWidth } = config;

    // Nested Template Strings, hooray! \o/
    return `
<style>
    :root {
        ${customProjectCardBackground && customProjectCardBackground.trim() ? `--dashboard-project-card-bg: ${customProjectCardBackground};` : ''}
        ${customProjectNameColor && customProjectNameColor.trim() ? `--dashboard-foreground: ${customProjectNameColor};` : ''}
        ${customProjectPathColor && customProjectPathColor.trim() ? `--dashboard-path: ${customProjectPathColor};` : ''}
        ${projectTileWidth && !isNaN(+projectTileWidth) ? `--column-width: ${projectTileWidth}px;` : ''}
    }
</style>`;
}

function getMediaResource(context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, name: string) {
    let resource = vscode.Uri.file(path.join(context.extensionPath, 'media', name));
    resource = webviewPanel.webview.asWebviewUri(resource);

    return resource;
}