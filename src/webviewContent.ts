import * as vscode from 'vscode';
import * as path from 'path';
import { Project, ProjectGroup } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, USE_PROJECT_ICONS, FITTY_OPTIONS } from './constants';

export function getDashboardContent(context: vscode.ExtensionContext, projectGroups: ProjectGroup[]): string {
    var stylesPath = getMediaResource(context, 'styles.css');
    var fittyPath = getMediaResource(context, 'fitty.min.js');
    var dragulaPath = getMediaResource(context, 'dragula.min.js');

    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${stylesPath}">
        <title>Cat Coding</title>
        ${getCustomStyle(context)}
    </head>
    <body>
        <div class="projects-wrapper">
            ${projectGroups.length ?
            projectGroups.map(getProjectGroupSection).join('\n')
            :
            getNoProjectsDiv()
        }           
        </div>
    </body>

    <script src="${fittyPath}"></script>
    <script src="${dragulaPath}"></script>

    <script>
        (function() {
            fitty('.project-header', ${JSON.stringify(FITTY_OPTIONS)});

            const vscode = acquireVsCodeApi();
            ${filePickerScript()}
            ${/*projectScript()*/1}
            ${dragAndDropScript('.projects-group')}
        })();
    </script>
</html>`;
}

function getProjectGroupSection(projectGroup: ProjectGroup) {
    var projects = projectGroup.projects;
    if (projects == null || !projects.length) {
        return "";
    }

    return `
    <div class="projects-group-title">
        ${projectGroup.groupName}
    </div>
    <div class="projects-group" data-group-id="${projectGroup.id}">
        ${projects.map(getProjectDiv).join('\n')}
        ${getAddProjectDiv(projectGroup.id)}
    </div>            
    `;
}

function getProjectDiv(project: Project) {
    return `
<div class="project-container">
    <div class="project" data-id="${project.id}" 
         style="${project.color ? `border-top-color: ${project.color};` : ''}">
        <div class="fitty-container">
            <h2 class="project-header">
                ${USE_PROJECT_ICONS && project.imageFileName ? `<img src="${getImagePath(project)}" />` : ''}
                ${project.name}
            </h2>
        </div>
        <p class="project-path-info">
            ${project.isGitRepo ? `<span class="git-icon" title="Git Repository">${getGitSvgIcon()}</span>` : ''}
            <span class="project-path" title="${project.path}">${project.path}</span>
        </p>
    </div>
</div>`
}

function getNoProjectsDiv() {
    return `
<div class="project-container">
    <div class="project no-projects" data-action="add-project">
        No projects have been added yet.
    </div>
</div>`
}

function getAddProjectDiv(projectGroupId: string) {
    return `
<div class="project-container slim last" data-nodrag>
    <div class="project add-project" data-action="add-project" data-project-group-id="${projectGroupId}">
        <h2 class="add-project-header">
            +
        </h2>
    </div>
</div>`
}

function getImagePath(project: Project) {
    return path.normalize(`${DATA_ROOT_PATH}/${PROJECT_IMAGE_FOLDER}/${project.imageFileName}`);
}

function filePickerScript() {
    return `
function handleFileSelect(evt) {
    evt.stopPropagation();
    var file = evt.target.files[0]; // FileList object
    if (file == null || !file.path)
        return;

    vscode.postMessage({
        type: 'selected-file',
        filePath: file.path,
    });
}

function readFileIntoMemory (file, callback) {
    var reader = new FileReader();
    reader.onload = function () {
        callback({
            name: file.name,
            size: file.size,
            type: file.type,
            content: new Uint8Array(this.result)
         });
    };
    reader.readAsArrayBuffer(file);
}
`;
}

function getCustomStyle(context: vscode.ExtensionContext) {
    var config = vscode.workspace.getConfiguration('dashboard')
    var { customProjectCardBackground, customProjectNameColor, customProjectPathColor } = config;

    // Nested Template Strings, hooray! \o/
    return `
<style>
    :root {
        ${customProjectCardBackground && customProjectCardBackground.trim() ? `--dashboard-project-card-bg: ${customProjectCardBackground};` : ''}
        ${customProjectNameColor && customProjectNameColor.trim() ? `--dashboard-foreground: ${customProjectNameColor};` : ''}
        ${customProjectPathColor && customProjectPathColor.trim() ? `--dashboard-path: ${customProjectPathColor};` : ''}
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

document.addEventListener('click', function(e) {
    if (!e.target)
        return;

    var projectDiv = e.target.closest('.project');
    if (!projectDiv)
        return;
    
    var dataId =projectDiv.getAttribute("data-id");
    if (dataId == null)
        return;

    var newWindow = !!e.ctrlKey;

    onProjectClicked(dataId, newWindow);
});

document
    .querySelectorAll('[data-action="add-project"]')
    .forEach(element => 
        element.addEventListener("click", onAddProjectClicked)
    );
`;
}

function dragAndDropScript(selector: string) {
    return `
window.onload = () => {
    var containers = document.querySelectorAll('${selector}');

    var drake = dragula([].slice.call(containers), {
        moves: function (el, source, handle, sibling) {
            return !el.hasAttribute("data-nodrag");
        },
    });

    drake.on('drop', onReordered);

    function onReordered() {
        // Build reordering object
        let groupElements = document.querySelectorAll('[data-group-id]');
        let groupOrders = [];
        
        for (let groupElement of groupElements){
            var groupOrder = {
                groupId: groupElement.getAttribute("data-group-id"),
                projectIds: [].slice.call(groupElement.querySelectorAll("[data-id]")).map(p => p.getAttribute("data-id")),
            };
            groupOrders.push(groupOrder);	
        }

        vscode.postMessage({
            type: 'projects-reordered',
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

function getMediaResource(context: vscode.ExtensionContext, name: string) {
    let resource = vscode.Uri.file(path.join(context.extensionPath, 'media', name));
    resource = resource.with({ scheme: 'vscode-resource' });

    return resource;
}