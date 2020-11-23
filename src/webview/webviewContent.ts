import * as vscode from 'vscode';
import * as path from 'path';

import { Project, Group, getRemoteType, ProjectRemoteType, DashboardInfos } from "../models";
import { FITTY_OPTIONS, REMOTE_REGEX } from '../constants';
import * as Icons from './webviewIcons';

export function getSidebarContent() {
    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
    </head>
    <body>
        <p>If you are reading this, you have placed the Project Dashboard sidebar view into another sidebar container. 
        This view is not intended to be visible. Instead, it is simply a shortcut for opening the main Project Dashboard.</p>

        <p>If you moved the sidebar view unintentionally and want to restore the original (intended) state, 
        please drag and drop this panel onto the sidebar.</p>

        <p>If you encounter any problems or think this behaviour is misleading, 
        <a href="https://github.com/Kruemelkatze/vscode-dashboard/issues">please let me know.</a></p>

    </body>
    </html>
`;
}

export function getDashboardContent(context: vscode.ExtensionContext, webview: vscode.Webview, groups: Group[], infos: DashboardInfos): string {
    var stylesPath = getMediaResource(context, webview, 'styles.css');
    var fittyPath = getMediaResource(context, webview, 'fitty.min.js');
    var dragulaPath = getMediaResource(context, webview, 'dragula.min.js');

    var projectScriptsPath = getMediaResource(context, webview, 'webviewProjectScripts.js');
    var dndScriptsPath = getMediaResource(context, webview, 'webviewDnDScripts.js');

    var customCss = infos.config.get('customCss') || "";

    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src * data:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${stylesPath}">
        <style>
            /* Custom CSS from configuration */
            ${customCss}
        </style>
        <title>Dashboard</title>
        ${getCustomStyle(infos.config)}
    </head>
    <body class="preload ${!groups.length ? 'dashboard-empty' : ''}">
        <div class="">
            <div class="groups-wrapper ${!infos.config.displayProjectPath ? 'hide-project-path' : ''}">
        ${groups.length ?
            groups.map(group => getGroupSection(group, groups.length, infos)).join('\n')
            :
            getNoProjectsDiv()
        }
            </div>

            ${getTempGroupSection(groups.length)}
        </div>

        ${getProjectContextMenu()}
        ${getGroupContextMenu()}
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

function getGroupSection(group: Group, totalGroupCount: number, infos: DashboardInfos) {
    // Apply changes to HTML here also to getTempGroupSection

    var showAddButton = infos.config.showAddProjectButtonTile;

    return `
<div class="group ${group.collapsed ? 'collapsed' : ''} ${group.projects.length === 0 ? 'no-projects' : ''}" data-group-id="${group.id}">
    <div class="group-title">
        <span class="group-title-text" data-action="collapse" data-drag-group>
            <span class="collapse-icon" title="Open/Collapse Group">${Icons.collapse}</span>
            ${group.groupName || "Unnamed Group"}
        </span>
        <div class="group-actions right">
            <span data-action="add" title="Add Project">${Icons.add}</span>
            <span data-action="edit" title="Edit Group">${Icons.edit}</span>
            <span data-action="remove" title="Remove Group">${Icons.remove}</span>
        </div>
    </div>
    <div class="group-list">
        <div class="drop-signal"></div>
        ${group.projects.map(p => getProjectDiv(p, infos)).join('\n')}
        ${showAddButton ? getAddProjectDiv(group.id) : ""}
    </div>       
</div>`;
}

function getTempGroupSection(totalGroupCount: number) {
    return `
<div class="group" id="tempGroup">
    <div class="group-title" data-action="add-group">
        <span>${Icons.add} New Group</span>
    </div>
    <div class="group-list">
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
    <div class="project" data-id="${project.id}" ${isRemote ? 'data-is-remote' : ''}>
        <div class="project-border" style="${borderStyle}"></div>
        <div class="project-actions-wrapper">
            <div class="project-actions">
                <span data-action="color" title="Edit Color">${Icons.palette}</span>
                <span data-action="edit" title="Edit Project">${Icons.edit}</span>
                <span data-action="remove" title="Remove Project">${Icons.remove}</span>
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

function getAddProjectDiv(groupId: string) {
    return `
<span class="project-container slim last" data-nodrag>
    <div class="project add-project" data-action="add-project" data-group-id="${groupId}">
        <h2 class="add-project-header">
            +
        </h2>
    </div>
</span>`
}

function getProjectContextMenu() {
    return `
<div id="projectContextMenu" class="custom-context-menu">
    <div class="custom-context-menu-item" data-action="open">
        Open Project
    </div>
    <div class="custom-context-menu-item" data-action="open-new-window">
        Open Project in new Window
    </div>
    <div class="custom-context-menu-item not-remote" data-action="open-add-to-workspace">
        Add to Workspace
    </div>

    <div class="custom-context-menu-separator"></div>
    
    <div class="custom-context-menu-item" data-action="color">
        Edit Color
    </div>
    <div class="custom-context-menu-item" data-action="edit">
        Edit Project
    </div>
    <div class="custom-context-menu-item" data-action="remove">
        Remove Project
    </div>
</div>
`;
}

function getGroupContextMenu() {
    return `
<div id="groupContextMenu" class="custom-context-menu">   
    <div class="custom-context-menu-item" data-action="add">
        Add Project
    </div>
    <div class="custom-context-menu-item" data-action="edit">
        Edit Group
    </div>
    <div class="custom-context-menu-item" data-action="remove">
        Remove Group
    </div>
</div>
`;
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

function getMediaResource(context: vscode.ExtensionContext, webview: vscode.Webview, name: string) {
    let resource = vscode.Uri.file(path.join(context.extensionPath, 'media', name));
    resource = webview.asWebviewUri(resource);

    return resource;
}