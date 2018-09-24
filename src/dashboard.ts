'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import { Project } from './models';
import { getProjects, saveProjectImageFile, addProject, removeProject, saveProjects, writeTextFile, } from './projectService';
import { getDashboardContent } from './webviewContent';
import { USE_PROJECT_ICONS, USE_PROJECT_COLOR, PREDEFINED_COLORS, TEMP_PATH } from './constants';

export function activate(context: vscode.ExtensionContext) {
    var instance: vscode.WebviewPanel = null;

    var isOnWelcomePage = (!vscode.workspace.name && vscode.window.visibleTextEditors.length === 0);
    if (isOnWelcomePage) {
        showDashboard();
    }

    const openCommand = vscode.commands.registerCommand('dashboard.open', () => {
        showDashboard();
    });

    const addProjectCommand = vscode.commands.registerCommand('dashboard.addProject', async () => {
        await addProjectPerCommand();
    });

    const removeProjectCommand = vscode.commands.registerCommand('dashboard.removeProject', async () => {
        await removeProjectPerCommand();
    });

    const editProjectsManuallyCommand = vscode.commands.registerCommand('dashboard.editProjects', async () => {
        await editProjectsManuallyPerCommand();
    });

    context.subscriptions.push(openCommand);
    context.subscriptions.push(addProjectCommand);
    context.subscriptions.push(removeProjectCommand);
    context.subscriptions.push(editProjectsManuallyCommand);

    console.log('vscode-dashboard has been activated');

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ Functions ~~~~~~~~~~~~~~~~~~~~~~~~~

    function showDashboard() {
        var columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : null;
        var projects = getProjects(context);

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
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    ],
                },
            );

            panel.webview.html = getDashboardContent(context, projects);

            // Reset when the current panel is closed
            panel.onDidDispose(() => {
                instance = null;
            }, null, context.subscriptions);

            panel.webview.onDidReceiveMessage(async (e) => {
                projects = getProjects(context);

                switch (e.type) {
                    case 'selected-file':
                        let filePath = e.filePath as string;
                        saveProjectImageFile(filePath, projects[0]);
                        break;
                    case 'selected-project':
                        let projectId = e.projectId as string;
                        let newWindow = e.newWindow as boolean;
                        let project = projects.find(p => p.id === projectId);
                        let uri = vscode.Uri.file(project.path);

                        let currentPath = vscode.workspace.rootPath;
                        if (currentPath != null && vscode.Uri.file(currentPath).path === uri.path) {
                            vscode.window.showInformationMessage("Selected Project is already opened.");
                        } else {
                            await vscode.commands.executeCommand("vscode.openFolder", uri, newWindow);
                        }
                        break;
                    case 'add-project':
                        await vscode.commands.executeCommand("dashboard.addProject");
                        break;
                }
            });

            instance = panel;
        }
    }

    async function addProjectPerCommand() {
        var projectName = await vscode.window.showInputBox({
            placeHolder: 'Project Name',
            ignoreFocusOut: true,
            validateInput: (val: string) => val ? '' : 'A Project Name must be provided.',
        });

        if (!projectName)
            return;

        let selectedProjectUris = await vscode.window.showOpenDialog({
            openLabel: 'Select as Project',
            canSelectFolders: true,
            canSelectMany: false,
        });

        if (selectedProjectUris == null || selectedProjectUris[0] == null)
            return;

        var projectPath: string = selectedProjectUris[0].fsPath;

        var color: string = null;
        if (USE_PROJECT_COLOR) {
            let colorPicks = PREDEFINED_COLORS.map(c => ({ id: c.label, label: c.label }))
            colorPicks.unshift({ id: 'None', label: 'None' });
            colorPicks.push({ id: 'Custom', label: 'Custom Hex' });
            let selectedColorPick = await vscode.window.showQuickPick(colorPicks, {
                placeHolder: "Project Color",
            });

            if (selectedColorPick != null && selectedColorPick.id === 'Custom') {
                var hex = await vscode.window.showInputBox({
                    placeHolder: '#cc3344',
                    ignoreFocusOut: true,
                    validateInput: (val: string) => {
                        let valid = val == null || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val);
                        return valid ? '' : 'Prove a valid Hex color code or leave empty.'
                    }
                });

                color = hex;
            } else if (selectedColorPick != null && selectedColorPick.id !== 'None') {
                let predefinedColor = PREDEFINED_COLORS.find(c => c.label == selectedColorPick.id);
                if (predefinedColor != null) {
                    color = predefinedColor.value;
                }
            }
        }

        var imageFilePath: string = null;
        if (USE_PROJECT_ICONS) {
            var selectImage = await vscode.window.showInputBox({
                placeHolder: 'Select Project Icon? (y/n)',
                ignoreFocusOut: true,
                validateInput: (val: string) => {
                    let valid = !val || ['y', 'n', 'yes', 'no'].indexOf(val.toLowerCase()) >= 0;
                    return valid ? '' : 'y/n only';
                }
            });

            var imageFilePath: string = null;
            if (selectImage && selectImage.startsWith('y')) {
                let selectedFiles = await vscode.window.showOpenDialog({
                    filters: {
                        'Images': ['png,', 'jpg', 'jpeg', 'gif'],
                    }
                });
                imageFilePath = selectedFiles ? selectedFiles[0].fsPath : null;

                if (!imageFilePath)
                    return;
            }
        }

        let project = new Project(projectName, projectPath);

        let imageFileName = imageFilePath ? path.basename(imageFilePath) : null;
        project.imageFileName = imageFileName;
        project.color = color;

        await addProject(context, project);

        if (imageFilePath != null) {
            await saveProjectImageFile(imageFilePath, project);
        }
        showDashboard();

        vscode.window.showInformationMessage(`Project ${project.name} created.`);
    }

    async function removeProjectPerCommand() {
        var projects = getProjects(context);
        let projectPicks = projects.map(p => ({ id: p.id, label: p.name }));

        let selectedProjectPick = await vscode.window.showQuickPick(projectPicks);

        if (selectedProjectPick == null)
            return;

        projects = await removeProject(context, selectedProjectPick.id)
        showDashboard();

        vscode.window.showInformationMessage(`Project ${selectedProjectPick.label} removed.`);
    }

    async function editProjectsManuallyPerCommand() {
        var projects = getProjects(context);
        const tempFilePath = `${TEMP_PATH}/Dashboard Projects.json`;
        await writeTextFile(tempFilePath, JSON.stringify(projects, null, 4));
        const tempFileUri = vscode.Uri.file(tempFilePath);

        var editProjectsDocument = await vscode.workspace.openTextDocument(tempFileUri);

        var textEditor = await vscode.window.showTextDocument(editProjectsDocument);

        var subscriptions: vscode.Disposable[] = [];
        var editSubscription = vscode.workspace.onWillSaveTextDocument(async (e) => {
            if (e.document == editProjectsDocument) {
                let updatedProjects;
                try {
                    updatedProjects = JSON.parse(e.document.getText());
                } catch (ex) {
                    vscode.window.showErrorMessage("Edited Projects File can not be parsed.")
                    return;
                }

                var jsonIsInvalid = false;
                if (Array.isArray(updatedProjects)) {
                    for (let project of updatedProjects) {
                        if (!project.id || !project.name || !project.path) {
                            jsonIsInvalid = true;
                            break;
                        }
                    }
                } else {
                    jsonIsInvalid = true;
                }

                if (jsonIsInvalid) {
                    vscode.window.showErrorMessage("Edited Projects File does not meet the Schema expected by Dashboard.");
                    return;
                }

                saveProjects(context, updatedProjects);
                showDashboard();

                subscriptions.forEach(s => s.dispose());
                // await deleteFile(tempFilePath); // Deleting file does not make sense, as the file gets immidiately saved again after this listener

                vscode.window.showInformationMessage("Saved Dashboard Projects.");

                // Select and close our document editor
                vscode.window.showTextDocument(e.document);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor')
            }
        });
        subscriptions.push(editSubscription);

        // onDidCloseTextDocument is not called if a file without any changes is closed
        // If the projects are not edited, but the file is closed, we cannot remove the temp file.
        // --> Use a fixed name for the temp file, so that we have at most 1 zombie file lying around
        // var closeSubscription = vscode.workspace.onDidCloseTextDocument(document => {
        //     if (document == editProjectsDocument) {
        //         subscriptions.forEach(s => s.dispose());
        //         deleteFile(tempFilePath);
        //     }
        // });
        // subscriptions.push(closeSubscription);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}

