import * as vscode from 'vscode';
import * as path from 'path';
import { Project } from "./models";
import { DATA_ROOT_PATH, PROJECT_IMAGE_FOLDER, USE_PROJECT_ICONS, FITTY_OPTIONS } from './constants';

export function getDashboardContent(context: vscode.ExtensionContext, projects: Project[]): string {
    var stylesPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'styles.css'));
    stylesPath = stylesPath.with({ scheme: 'vscode-resource' });

    var fittyPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'fitty.min.js'));
    fittyPath = fittyPath.with({ scheme: 'vscode-resource' });

    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${stylesPath}">
        <title>Cat Coding</title>
    </head>
    <body>
        <div class="projects-wrapper">
            ${projects.length ?
            projects.map(getProjectDiv).join('\n')
            :
            getNoProjectsDiv()
        }
            ${getAddProjectDiv()}
        </div>
    </body>

    <script src="${fittyPath}"></script>
    <script>
        (function() {
            fitty('.project-header', ${JSON.stringify(FITTY_OPTIONS)});

            const vscode = acquireVsCodeApi();
            ${filePickerScript()}
            ${projectScript()}
        })();
    </script>
</html>`;
}

function getProjectDiv(project) {
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
        <p class="project-path" title="${project.path}">${project.path}</p>
    </div>
</div>`
}

function getNoProjectsDiv() {
    return `
<div class="project-container">
    <div class="project no-projects" id="addProject">
        No projects have been added yet.
    </div>
</div>`
}

function getAddProjectDiv() {
    return `
<div class="project-container">
    <div class="project add-project" id="addProject">
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

function projectScript() {
    return `
function onProjectClicked(projectId, newWindow) {
    vscode.postMessage({
        type: 'selected-project',
        projectId,
        newWindow,
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
    .getElementById("addProject")
    .addEventListener("click", function() {
        vscode.postMessage({
            type: 'add-project',
        });
    });
`;
}