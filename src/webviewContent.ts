import * as vscode from 'vscode';
import * as path from 'path';
import { Project } from "./models";

export function getDashboardContent(context: vscode.ExtensionContext, projects: Project[]): string {
    var stylesPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'styles.css'));
    stylesPath = stylesPath.with({ scheme: 'vscode-resource' });

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
        <div class="project-row">
            ${projects.map(getProjectDiv).join('\n')}
        </div>
    </body>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            ${filePickerScript()}
            ${projectScript()}
        })();
    </script>
</html>`;
}

function getProjectDiv(project) {
    return `
<div class="project-col">
    <div class="project" onclick="onProjectClicked('${project.id}')">
        <h1>${project.name}</h1>
        <p>${project.path.replace(/([\\\/])/ig, '$1&#8203;')}</p>

        <!-- <input type="file" id="file" accept="image/*" /> -->
    </div>
</div>`
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

document.getElementById('file').addEventListener('change', handleFileSelect, false);
`;
}

function projectScript() {
    return `
function onProjectClicked(projectId) {
    vscode.postMessage({
        type: 'selected-project',
        projectId,
    });
}

window.onProjectClicked = onProjectClicked;
`;
}