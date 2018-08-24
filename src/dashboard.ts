'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Project, IDashboardConfig, FileInfo } from './models';
import { PROJECT_IMAGE_FOLDER } from './constants';
import { getProjects, saveProjects, saveProjectImageFile } from './persistingServices';
import { getDashboardContent } from './webviewContent';

const testProjects: Project[] = [
    {
        id: "foodfelf",
        name: "AAU Food",
        imageFilePath: `${PROJECT_IMAGE_FOLDER}/foodfelf.png`,
        path: "C:\\Users\\Fabian\\WebstormProjects\\AAUFood",
    }
];



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    var instance: vscode.WebviewPanel = null;

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "dashboard" is now active!');

    var isOnWelcomePage = (!vscode.workspace.name && vscode.window.visibleTextEditors.length === 0);
    if (isOnWelcomePage) {
        showDashboard(instance, context);
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const openCommand = vscode.commands.registerCommand('dashboard.open', () => {
        showDashboard(instance, context);
    });

    const saveProjectsCommand = vscode.commands.registerCommand('dashboard.testSaveProjects', async () => {
        await saveProjects(context, testProjects);
    });

    const addProjectCommand = vscode.commands.registerCommand('dashboard.addProject', async () => {
        var projectName = await vscode.window.showInputBox({
            placeHolder: 'Project Name',
            validateInput: (val: string) => val ? '' : 'A Project Name must be provided.',
        });

        var projectPath = await vscode.window.showInputBox({
            placeHolder: 'Project Directory or File',
            validateInput: (val: string) => {
                let exists = fs.existsSync(val)
                return exists ? '' : 'Directory or File does not exist.';
            }
        });

        var project = new Project(projectName, projectPath);
        var projects = getProjects(context);
        projects.push(project);
        await saveProjects(context, projects);
    });

    context.subscriptions.push(openCommand);
    context.subscriptions.push(saveProjectsCommand);
    context.subscriptions.push(addProjectCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function showDashboard(instance: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : null;

    if (instance) {
        instance.reveal(columnToShowIn);
    } else {
        var stylesPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'styles.css'));
        stylesPath = stylesPath.with({ scheme: 'vscode-resource' });

        const projects = getProjects(context);

        const dashboardConfig: IDashboardConfig = {
            stylesPath,
            projects,
        };

        const panel = vscode.window.createWebviewPanel(
            "dashboard",
            "Dashboard",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        panel.webview.html = getDashboardContent(dashboardConfig);

        // Reset when the current panel is closed
        panel.onDidDispose(() => {
            instance = null;
        }, null, context.subscriptions);

        panel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'selected-file':
                    let fileInfo = e.fileInfo as FileInfo;
                    saveProjectImageFile(fileInfo, projects[0]);
                    break;
                case 'selected-project':
                    let projectId = e.projectId as string;
                    let project = projects.find(p => p.id === projectId);
                    try {
                        let uri = vscode.Uri.file(project.path);
                        await vscode.commands.executeCommand("vscode.openFolder", uri, false);
                    } catch (error) {
                        debugger
                    }
                    break;
            }
        });

        instance = panel;
    }
}



