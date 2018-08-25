'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { Project, FileInfo } from './models';
import { loadProjects, saveProjectImageFile, addProject, removeProject } from './projectService';
import { getDashboardContent } from './webviewContent';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    var instance: vscode.WebviewPanel = null;
    var projects: Project[];

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "dashboard" is now active!');

    var isOnWelcomePage = (!vscode.workspace.name && vscode.window.visibleTextEditors.length === 0);
    if (isOnWelcomePage) {
        showDashboard();
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const openCommand = vscode.commands.registerCommand('dashboard.open', () => {
        showDashboard();
    });

    const addProjectCommand = vscode.commands.registerCommand('dashboard.addProject', async () => {
        await addProjectPerCommand();
    });

    const removeProjectCommand = vscode.commands.registerCommand('dashboard.removeProject', async () => {
        await removeProjectPerCommand();
    });

    context.subscriptions.push(openCommand);
    context.subscriptions.push(addProjectCommand);
    context.subscriptions.push(removeProjectCommand);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ Functions ~~~~~~~~~~~~~~~~~~~~~~~~~
    function setProjectsUpdateDashboard(updatedProjects: Project[]) {
        projects = updatedProjects;

        if (instance != null) {
            instance.webview.html = getDashboardContent(context, projects);
        }
    }

    function getProjects() {
        projects = projects != null ? projects : loadProjects(context);
        return projects;
    }

    function showDashboard() {
        var columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : null;
        var projects = getProjects();

        if (instance) {
            instance.webview.html = getDashboardContent(context, projects);
            instance.reveal(columnToShowIn);
        } else {
            var panel = vscode.window.createWebviewPanel(
                "dashboard",
                "Dashboard",
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            panel.webview.html = getDashboardContent(context, projects);

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

    async function addProjectPerCommand() {
        var projectName = await vscode.window.showInputBox({
            placeHolder: 'Project Name',
            validateInput: (val: string) => val ? '' : 'A Project Name must be provided.',
        });

        if (!projectName)
            return;

        var projectPath = await vscode.window.showInputBox({
            placeHolder: 'Project Directory or File',
            validateInput: (val: string) => {
                let exists = fs.existsSync(val)
                return exists ? '' : 'Directory or File does not exist.';
            }
        });

        if (!projectPath)
            return;

        let project = new Project(projectName, projectPath);
        let projects = await addProject(context, project);
        setProjectsUpdateDashboard(projects);
    }

    async function removeProjectPerCommand() {
        var projects = getProjects();
        let projectPicks = projects.map(p => ({ id: p.id, label: p.name }));

        let selectedProjectPick = await vscode.window.showQuickPick(projectPicks);

        if (selectedProjectPick == null)
            return;

        projects = await removeProject(context, selectedProjectPick.id)
        setProjectsUpdateDashboard(projects);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}

