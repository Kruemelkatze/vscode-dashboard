import * as vscode from 'vscode';
import * as path from 'path';
import { Project, ProjectGroup, getRemoteType, ProjectRemoteType, DashboardInfos } from "./models";
import { FITTY_OPTIONS, REMOTE_REGEX } from './constants';

export function getDashboardContent(context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, projectGroups: ProjectGroup[], infos: DashboardInfos): string {
    var stylesPath = getMediaResource(context, webviewPanel, 'styles.css');
    var fittyPath = getMediaResource(context, webviewPanel, 'fitty.min.js');
    var dragulaPath = getMediaResource(context, webviewPanel, 'dragula.min.js');

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
    <body class="preload">
        <div class="${!infos.config.displayProjectPath ? 'hide-project-path' : ''}">
            <div class="projects-wrapper">
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

    <script>
        (function() {
            fitty('.project-header', ${JSON.stringify(FITTY_OPTIONS)});

            const vscode = acquireVsCodeApi();
            ${projectScript()}
            ${dragAndDropScripts('.projects-group-list', '.projects-wrapper')}
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
            <span class="collapse-icon" title="Open/Collapse Project Group">${getCollapseIcon()}</span>
            ${projectGroup.groupName || "Unnamed Project Group"}
        </span>
        <div class="projects-group-actions right">
            <span data-action="add" title="Add Project">${getAddIcon()}</span>
        </div>
        <div class="projects-group-actions left">
            <!-- <span data-action="drag">${getDragIcon()}</span> -->
            <span data-action="edit" title="Edit Project Group">${getEditIcon()}</span>
            <span data-action="delete" title="Remove Project Group">${getDeleteIcon()}</span>
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
        <span>${getAddIcon()} New Project Group</span>
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
                <span data-action="color" title="Edit Color">${getPaletteIcon()}</span>
                <span data-action="edit" title="Edit Project">${getEditIcon()}</span>
                <span data-action="delete" title="Remove Project">${getDeleteIcon()}</span>
            </div>
        </div>
        <div class="fitty-container">
            <h2 class="project-header">
                ${project.name}
            </h2>
        </div>
        <p class="project-path-info">
            ${isRemote ? `<span class="remote-icon ${remoteExError ? 'error-icon' : ''}" title="${remoteExError ? 'Remote Development extension is not installed' : 'Remote Project'}">${getRemoteIcon()}</span>` : ''}
            ${project.isGitRepo ? `<span class="git-icon" title="Git Repository">${getGitSvgIcon()}</span>` : ''}
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

function projectScript() {
    return `
function onProjectClicked(projectId, newWindow) {
    vscode.postMessage({
        type: 'selected-project',
        projectId,
        newWindow,
    });
}

function onAddProjectClicked(e) {
    if (!e.target)
        return;

    var projectDiv = e.target.closest('.project');
    if (!projectDiv)
        return;

    var projectGroupId = projectDiv.getAttribute("data-project-group-id");

    vscode.postMessage({
        type: 'add-project',
        projectGroupId,
    });
}

function onInsideProjectClick(e, projectDiv) {
    var dataId = projectDiv.getAttribute("data-id");
    if (dataId == null)
        return;

    if (onTriggerProjectAction(e.target, dataId))
        return;

    var newWindow = e.ctrlKey || e.metaKey;
    onProjectClicked(dataId, newWindow);
}

function onInsideProjectsGroupClick(e, projectsGroupDiv) {
    var groupId = projectsGroupDiv.getAttribute("data-group-id");
    if (groupId == null)
        return;

    var actionDiv = e.target.closest('[data-action]')
    var action = actionDiv != null ? actionDiv.getAttribute("data-action") : null;
    if (!action)
        return;

    if (action === "add"){
        vscode.postMessage({
            type: 'add-project',
            projectGroupId: groupId,
        });

        return;
    }

    if (action === "collapse") {
        projectsGroupDiv.classList.toggle("collapsed");
    }

    vscode.postMessage({
        type: action + '-projects-group',
        projectGroupId: groupId,
    });
}

function onTriggerProjectAction(target, projectId) {
    var actionDiv = target.closest('[data-action]')
    if (actionDiv == null)
        return false;

    var action = actionDiv.getAttribute("data-action");
    if (!action)
        return false;

    vscode.postMessage({
        type: action + '-project',
        projectId,
    });

    return true;
}

document.addEventListener('click', function(e) {
    if (!e.target)
        return;

    if (e.target.closest('[data-action="add-projects-group"]')) {
        vscode.postMessage({
            type: 'add-projects-group'
        });
        return;
    }

    var projectDiv = e.target.closest('.project');
    if (projectDiv) {
        onInsideProjectClick(e, projectDiv);
        return;
    }
    
    var projectsGroupDiv = e.target.closest('.projects-group');
    if (projectsGroupDiv) {      
        onInsideProjectsGroupClick(e, projectsGroupDiv);
        return;
    }    
});

document
    .querySelectorAll('[data-action="add-project"]')
    .forEach(element => 
        element.addEventListener("click", onAddProjectClicked)
    );
`;
}

function dragAndDropScripts(projectsContainerSelector: string, projectsGroupsContainerSelector: string) {
    return `
window.onload = () => {
    document.body.classList.remove("preload");

    var projectsContainers = document.querySelectorAll('${projectsContainerSelector}');
    var projectDrake = dragula([].slice.call(projectsContainers), {
        moves: function (el, source, handle, sibling) {
            return !el.hasAttribute("data-nodrag");
        },
    });
    projectDrake.on('drop', onReordered);
    projectDrake.on('drag', () => document.body.classList.add('project-dragging'));
    projectDrake.on('dragend', () => document.body.classList.remove('project-dragging'));

    var projectsGroupsContainers = document.querySelectorAll('${projectsGroupsContainerSelector}');
    var projectsGroupsDrake = dragula([].slice.call(projectsGroupsContainers), {
        moves: function (el, source, handle, sibling) {
            return handle.hasAttribute("data-drag-group");
        },
    });
    projectsGroupsDrake.on('drop', onReordered);

    function onReordered() {
        // Build reordering object
        let groupElements = [...document.querySelectorAll('${projectsGroupsContainerSelector} [data-group-id]')];

        // If a project was dropped on the Create New Group element...
        let tempGroupElement = document.querySelector('#tempGroup');
        if (tempGroupElement && tempGroupElement.querySelector("[data-id]")) {
            // ... Handle it as a new group
            groupElements.push(tempGroupElement);
        }

        let groupOrders = [];        
        for (let groupElement of groupElements){
            var groupOrder = {
                groupId: groupElement.getAttribute("data-group-id") || "",
                projectIds: [].slice.call(groupElement.querySelectorAll("[data-id]")).map(p => p.getAttribute("data-id")),
            };
            groupOrders.push(groupOrder);	
        }       

        console.log("onreordered")

        vscode.postMessage({
            type: 'reordered-projects',
            groupOrders,
        });
    }
};`;
}

// This was way easier to include and style than a file
// Original Author: Jason Long, Source: https://commons.wikimedia.org/wiki/File:Git_icon.svg
function getGitSvgIcon() {
    return `
<svg viewBox="0 0 97 97">
    <path d="M92.71,44.408L52.591,4.291c-2.31-2.311-6.057-2.311-8.369,0l-8.33,8.332L46.459,23.19
        c2.456-0.83,5.272-0.273,7.229,1.685c1.969,1.97,2.521,4.81,1.67,7.275l10.186,10.185c2.465-0.85,5.307-0.3,7.275,1.671
        c2.75,2.75,2.75,7.206,0,9.958c-2.752,2.751-7.208,2.751-9.961,0c-2.068-2.07-2.58-5.11-1.531-7.658l-9.5-9.499v24.997
        c0.67,0.332,1.303,0.774,1.861,1.332c2.75,2.75,2.75,7.206,0,9.959c-2.75,2.749-7.209,2.749-9.957,0c-2.75-2.754-2.75-7.21,0-9.959
        c0.68-0.679,1.467-1.193,2.307-1.537V36.369c-0.84-0.344-1.625-0.853-2.307-1.537c-2.083-2.082-2.584-5.14-1.516-7.698
        L31.798,16.715L4.288,44.222c-2.311,2.313-2.311,6.06,0,8.371l40.121,40.118c2.31,2.311,6.056,2.311,8.369,0L92.71,52.779
        C95.021,50.468,95.021,46.719,92.71,44.408z"/>
</svg>
    `;
}

function getEditIcon() {
    return `
<svg viewBox="0 0 512 512">
    <path d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z"/>
</svg>
`;
}

function getDeleteIcon() {
    return `
<svg viewBox="0 0 512 512">
    <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>
</svg>
`;
}

function getDragIcon() {
    return `
<svg viewBox="0 0 512 512">
    <path d="M352.201 425.775l-79.196 79.196c-9.373 9.373-24.568 9.373-33.941 0l-79.196-79.196c-15.119-15.119-4.411-40.971 16.971-40.97h51.162L228 284H127.196v51.162c0 21.382-25.851 32.09-40.971 16.971L7.029 272.937c-9.373-9.373-9.373-24.569 0-33.941L86.225 159.8c15.119-15.119 40.971-4.411 40.971 16.971V228H228V127.196h-51.23c-21.382 0-32.09-25.851-16.971-40.971l79.196-79.196c9.373-9.373 24.568-9.373 33.941 0l79.196 79.196c15.119 15.119 4.411 40.971-16.971 40.971h-51.162V228h100.804v-51.162c0-21.382 25.851-32.09 40.97-16.971l79.196 79.196c9.373 9.373 9.373 24.569 0 33.941L425.773 352.2c-15.119 15.119-40.971 4.411-40.97-16.971V284H284v100.804h51.23c21.382 0 32.09 25.851 16.971 40.971z"></path>
</svg>
`;
}

function getAddIcon() {
    return `
<svg viewBox="0 0 512 512">
    <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
</svg>
`;
}

function getRemoteIcon() {
    return `
<svg viewBox="0 0 640 512">
    <path d="M257.981 272.971L63.638 467.314c-9.373 9.373-24.569 9.373-33.941 0L7.029 444.647c-9.357-9.357-9.375-24.522-.04-33.901L161.011 256 6.99 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L257.981 239.03c9.373 9.372 9.373 24.568 0 33.941zM640 456v-32c0-13.255-10.745-24-24-24H312c-13.255 0-24 10.745-24 24v32c0 13.255 10.745 24 24 24h304c13.255 0 24-10.745 24-24z"></path>
</svg>
`;
}

function getCollapseIcon() {
    return `
<svg viewBox="0 0 320 512">
    <path d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path>
</svg>  
`;
}

function getPaletteIcon() {
    return `
<svg viewBox="0 0 512 512">
    <path d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"></path>
</svg>
`;
}

function getMediaResource(context: vscode.ExtensionContext, webviewPanel: vscode.WebviewPanel, name: string) {
    let resource = vscode.Uri.file(path.join(context.extensionPath, 'media', name));
    resource = webviewPanel.webview.asWebviewUri(resource);

    return resource;
}