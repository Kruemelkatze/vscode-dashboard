import { IDashboardConfig } from "./models";

export function getDashboardContent(config: IDashboardConfig): string {
    return `
<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="${config.stylesPath}">
        <title>Cat Coding</title>
    </head>
    <body>
        <div class="project-row">
            ${config.projects.map(getProjectDiv).join('\n')}
        </div>
    </body>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            ${filePickerScript()}
        })();
    </script>
</html>`;
}

function getProjectDiv(project) {
    return `
<div class="project-col">
    ${project.name}
    <input type="file" id="file" accept="image/*" />
</div>`
}

function filePickerScript() {
    return `
function handleFileSelect(evt) {
    var file = evt.target.files[0]; // FileList object
    debugger
    if (file == null)
        return;

    var fileInfo = readFileIntoMemory(file,
        fileInfo => {
            debugger

            vscode.postMessage({
                type: 'selected-file',
                fileInfo,
            });
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