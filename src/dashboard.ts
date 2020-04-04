'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import { Project, GroupOrder, Group, ProjectRemoteType, getRemoteType, DashboardInfos } from './models';
import { getProjects, addProject, removeProject, saveGroups, writeTextFile, getProject, addGroup, getProjectsFlat, migrateDataIfNeeded, getProjectAndGroup, updateProject, getGroup, updateGroup, removeGroup, getRecentColors, getColorName, getRandomColor } from './projectService';
import { getDashboardContent } from './webview/webviewContent';
import { USE_PROJECT_COLOR, PREDEFINED_COLORS, StartupOptions, USER_CANCELED, FixedColorOptions, RelevantExtensions, SSH_REGEX, REMOTE_REGEX, SSH_REMOTE_PREFIX } from './constants';
import { execSync } from 'child_process';
import { lstatSync } from 'fs';

export function activate(context: vscode.ExtensionContext) {
    var instance: vscode.WebviewPanel = null;

    const dashboardInfos: DashboardInfos = {
        relevantExtensionsInstalls: {
            remoteSSH: false,
        },
        get config() { return vscode.workspace.getConfiguration('dashboard') },
    };

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

    const addGroupCommand = vscode.commands.registerCommand('dashboard.addGroup', async () => {
        await addGroupPerCommand();
    });

    const removeGroupCommand = vscode.commands.registerCommand('dashboard.removeGroup', async () => {
        await removeGroupPerCommand();
    });

    context.subscriptions.push(openCommand);
    context.subscriptions.push(addProjectCommand);
    context.subscriptions.push(removeProjectCommand);
    context.subscriptions.push(editProjectsManuallyCommand);
    context.subscriptions.push(addGroupCommand);
    context.subscriptions.push(removeGroupCommand);

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("dashboard")) {
            checkDataMigration(true);
        }
    });

    startUp();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~ Functions ~~~~~~~~~~~~~~~~~~~~~~~~~
    async function checkDataMigration(openDashboardAfterMigrate: boolean = false) {
        let migrated = await migrateDataIfNeeded(context);
        if (migrated) {
            vscode.window.showInformationMessage("Migrated Dashboard Projects after changing Settings.");

            if (openDashboardAfterMigrate) {
                showDashboard();
            }
        }
    }

    async function startUp() {
        for (let exName in dashboardInfos.relevantExtensionsInstalls) {
            let exId = RelevantExtensions[exName];
            let installed = vscode.extensions.getExtension(exId) !== undefined;
            dashboardInfos.relevantExtensionsInstalls[exName] = installed;
        }

        await checkDataMigration();

        showDashboardOnOpenIfNeeded();
    }

    function showDashboardOnOpenIfNeeded() {
        var { openOnStartup } = dashboardInfos.config;

        var open = false;

        switch (openOnStartup) {
            case StartupOptions.always:
                open = true;
                break;
            case StartupOptions.never:
                break;
            case StartupOptions.emptyWorkSpace:
            default:
                let editors = vscode.window.visibleTextEditors;
                // Includes Workaround for temporary code runner file
                let noOpenEditorsOrWorkspaces = !vscode.workspace.name && (
                    editors.length === 0 || editors.length === 1 && editors[0].document.languageId === "code-runner-output"
                );
                open = noOpenEditorsOrWorkspaces;
                break;
        }

        if (open) {
            showDashboard();
        }
    }

    function showDashboard() {
        var columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : null;
        var projects = getProjects(context);

        if (instance) {
            instance.webview.html = getDashboardContent(context, instance, projects, dashboardInfos);
            instance.reveal(columnToShowIn);
        } else {
            var panel = vscode.window.createWebviewPanel(
                "dashboard",
                "Project Dashboard",
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    ],
                },
            );
            panel.iconPath = vscode.Uri.file("");

            panel.webview.html = getDashboardContent(context, panel, projects, dashboardInfos);

            // Reset when the current panel is closed
            panel.onDidDispose(() => {
                instance = null;
            }, null, context.subscriptions);

            panel.webview.onDidReceiveMessage(async (e) => {
                let projectId: string, groupId: string;
                switch (e.type) {
                    case 'selected-project':
                        projectId = e.projectId as string;
                        let newWindow = e.newWindow as boolean;
                        let project = getProject(context, projectId);
                        if (project == null) {
                            vscode.window.showWarningMessage("Selected Project not found.");
                            break;
                        }

                        await openProject(project, newWindow);
                        break;
                    case 'add-project':
                        groupId = e.groupId as string;
                        await addProjectPerCommand(groupId);
                        break;
                    case 'reordered-projects':
                        let groupOrders = e.groupOrders as GroupOrder[];
                        await reorderGroups(groupOrders);
                        break;
                    case 'delete-project':
                        projectId = e.projectId as string;
                        await deleteProject(projectId);
                        break;
                    case 'edit-project':
                        projectId = e.projectId as string;
                        await editProject(projectId);
                        break;
                    case 'color-project':
                        projectId = e.projectId as string;
                        await editProjectColor(projectId);
                        break;
                    case 'edit-group':
                        groupId = e.groupId as string;
                        await editGroup(groupId);
                        break;
                    case 'delete-group':
                        groupId = e.groupId as string;
                        await deleteGroup(groupId);
                        break;
                    case 'add-group':
                        await addGroupPerCommand();
                        break;
                    case 'collapse-group':
                        groupId = e.groupId as string;
                        await collapseGroup(groupId);
                        break;
                }
            });

            instance = panel;
        }
    }

    async function addGroupPerCommand() {
        var groupName;

        try {
            groupName = await queryGroupFields();
        } catch (error) {
            if (error.message !== USER_CANCELED) {
                vscode.window.showErrorMessage(`An error occured while adding the group.`);
                throw error; // Rethrow error to make vscode log it
            }

            return;
        }

        var group = await addGroup(context, groupName);
        showDashboard();
    }

    async function editGroup(groupId: string) {
        var group = getGroup(context, groupId);
        if (group == null) {
            return;
        }

        var groupName;

        try {
            groupName = await queryGroupFields();
        } catch (error) {
            if (error.message !== USER_CANCELED) {
                vscode.window.showErrorMessage(`An error occured while editing the group.`);
                throw error; // Rethrow error to make vscode log it
            }

            return;
        }

        // Name
        group.groupName = groupName;
        await updateGroup(context, groupId, group);

        showDashboard();
    }

    async function queryGroupFields(defaultText: string = null): Promise<string> {
        var groupName = await vscode.window.showInputBox({
            value: defaultText || undefined,
            valueSelection: defaultText ? [0, defaultText.length] : undefined,
            placeHolder: 'Group Name',
            ignoreFocusOut: true,
            validateInput: (val: string) => val ? '' : 'A Group Name must be provided.',
        });

        if (groupName == null) {
            throw new Error(USER_CANCELED);
        }

        return groupName;
    }

    async function removeGroupPerCommand() {
        var [groupId, newlyCreated] = await queryGroup();
        deleteGroup(groupId);
    }

    async function deleteGroup(groupId: string) {
        var group = getGroup(context, groupId);
        if (group == null) {
            return;
        }

        let accepted = await vscode.window.showWarningMessage(`Delete ${group.groupName}?`, { modal: true }, 'Delete');
        if (!accepted) {
            return;
        }

        await removeGroup(context, groupId);
        showDashboard();
    }

    async function collapseGroup(groupId: string) {
        var group = getGroup(context, groupId);
        if (group == null) {
            return;
        }

        group.collapsed = !group.collapsed;
        await updateGroup(context, groupId, group);

        //showDashboard(); // No need to repaint for that
    }

    async function openProject(project: Project, openInNewWindow: boolean): Promise<void> {
        // project is parsed from JSON at runtime, so its not an instance of Project
        let remoteType = getRemoteType(project);
        let projectPath = (project.path || '').trim();

        let uri: vscode.Uri;
        switch (remoteType) {
            case ProjectRemoteType.None:
                uri = vscode.Uri.file(projectPath);
                await vscode.commands.executeCommand("vscode.openFolder", uri, openInNewWindow);
                break;
            case ProjectRemoteType.SSH:
                let remotePathMatch = projectPath.replace(SSH_REMOTE_PREFIX, '').match(SSH_REGEX);
                let hasRemoteFolder = remotePathMatch.groups.folder != null;

                if (hasRemoteFolder) {
                    uri = vscode.Uri.parse(projectPath);
                    vscode.commands.executeCommand("vscode.openFolder", uri, openInNewWindow)
                } else {
                    vscode.commands.executeCommand("vscode.newWindow", {
                        remoteAuthority: projectPath.replace("vscode-remote://", ""),
                        reuseWindow: !openInNewWindow,
                    });
                }
                break;
        }
    }

    async function addProjectPerCommand(groupId: string = null) {
        var project: Project, selectedGroupId: string;

        try {
            [project, selectedGroupId] = await queryProjectFields(groupId);
            await addProject(context, project, selectedGroupId);
        } catch (error) {
            if (error.message !== USER_CANCELED) {
                vscode.window.showErrorMessage(`An error occured while adding the project.`);
                throw error; // Rethrow error to make vscode log it
            }

            return;
        }

        showDashboard();
    }

    async function editProject(projectId: string) {
        var [project, group] = getProjectAndGroup(context, projectId);
        if (project == null || group == null) {
            return;
        }

        var editedProject: Project, selectedGroupId: string;
        try {
            [editedProject, selectedGroupId] = await queryProjectFields(group.id, project);
            await updateProject(context, projectId, editedProject);
        } catch (error) {
            if (error.message !== USER_CANCELED) {
                vscode.window.showErrorMessage(`An error occured while updating project ${project.name}.`);
                throw error;
            }

            return;
        }

        showDashboard();
    }

    async function editProjectColor(projectId: string) {
        var [project, group] = getProjectAndGroup(context, projectId);
        if (project == null || group == null) {
            return;
        }

        try {
            project.color = await queryProjectColor(project);
            await updateProject(context, projectId, project);
        } catch (error) {
            if (error.message !== USER_CANCELED) {
                vscode.window.showErrorMessage(`An error occured while updating project ${project.name}.`);
                throw error;
            }

            return;
        }

        showDashboard();
    }

    async function queryProjectFields(groupId: string = null, projectTemplate: Project = null): Promise<[Project, string]> {
        // For editing a project: Ignore Group selection and take it from template
        var selectedGroupId: string, projectPath: string;
        var isEditing = projectTemplate != null && groupId != null;
        var groupWasNewlyCreated = false;

        try {
            if (isEditing) {
                // Editing
                selectedGroupId = groupId;
                projectPath = projectTemplate.path;
            } else {
                // New
                if (groupId != null) {
                    selectedGroupId = groupId;
                } else {
                    [selectedGroupId, groupWasNewlyCreated] = await queryGroup(groupId, true);
                }
                projectPath = await queryProjectPath();
            }

            var defaultProjectName = projectTemplate ? projectTemplate.name : null;
            defaultProjectName = defaultProjectName || getLastPartOfPath(projectPath).replace(/\.code-workspace$/g, '');

            // Name
            var projectName = await vscode.window.showInputBox({
                value: defaultProjectName || undefined,
                valueSelection: defaultProjectName ? [0, defaultProjectName.length] : undefined,
                placeHolder: 'Project Name',
                ignoreFocusOut: true,
                validateInput: (val: string) => val ? '' : 'A Project Name must be provided.',
            });

            if (!projectName) {
                if (groupWasNewlyCreated) {
                    await removeGroup(context, selectedGroupId, true);
                }
                throw new Error(USER_CANCELED);
            }

            // Updating path if needed
            if (isEditing) {
                let updatePathPicks = [
                    {
                        id: false,
                        label: "Keep Path",
                    },
                    {
                        id: true,
                        label: "Edit Path"
                    },
                ]
                let updatePath = await vscode.window.showQuickPick(updatePathPicks, {
                    placeHolder: "Edit Path?"
                });

                if (updatePath == null) {
                    throw new Error(USER_CANCELED);
                }

                if (updatePath.id) {
                    projectPath = await queryProjectPath(projectPath);
                }
            }

            // Color
            var color = isEditing ? projectTemplate.color : await queryProjectColor(projectTemplate);

            //Test if Git Repo
            let isGitRepo = isFolderGitRepo(projectPath);

            // Save
            let project = new Project(projectName, projectPath);
            project.color = color;
            project.isGitRepo = isGitRepo;

            return [project, selectedGroupId];
        } catch (e) {
            // Cleanup
            if (groupWasNewlyCreated) {
                await removeGroup(context, selectedGroupId, true);
            }

            throw e;
        }
    }

    async function queryGroup(groupId: string = null, optionForAdding: boolean = false): Promise<[string, boolean]> {
        var groups = getProjects(context);

        if (optionForAdding && !groups.length) {
            groupId = 'Add';
        } else {
            // Reorder array to set given group to front (to quickly select it).
            let orderedGroups = groups;
            if (groupId != null) {
                let idx = groups.findIndex(g => g.id === groupId);
                if (idx != null) {
                    orderedGroups = groups.slice();
                    let group = orderedGroups.splice(idx, 1);
                    orderedGroups.unshift(...group);
                }
            }

            let defaultGroupSet = false;
            let groupPicks = orderedGroups.map(group => {
                let label = group.groupName;
                if (!label) {
                    label = defaultGroupSet ? 'Unnamed Group' : 'Default Group';
                    defaultGroupSet = true;
                }

                return {
                    id: group.id,
                    label,
                }
            });

            if (optionForAdding) {
                groupPicks.push({
                    id: "Add",
                    label: "Add new Group",
                });
            }


            let selectedGroupPick = await vscode.window.showQuickPick(groupPicks, {
                placeHolder: "Group"
            });

            if (selectedGroupPick == null) {
                throw new Error(USER_CANCELED);
            }

            groupId = selectedGroupPick.id;

        }

        var newlyCreated = false;
        if (groupId === 'Add') {
            let newGroupName = await vscode.window.showInputBox({
                placeHolder: 'New Group Name',
                ignoreFocusOut: true,
                validateInput: (val: string) => val ? '' : 'A Group Name must be provided.',
            });

            if (newGroupName == null) {
                throw new Error(USER_CANCELED);
            }

            groupId = (await addGroup(context, newGroupName)).id;
            newlyCreated = true;
        }

        return [groupId, newlyCreated];
    }

    async function queryProjectPath(defaultPath: string = null): Promise<string> {
        let projectTypePicks = [
            { id: 'dir', label: 'Folder Project' },
            { id: 'file', label: 'File or Multi-Root Project' },
            { id: 'ssh', label: `SSH Target ${!dashboardInfos.relevantExtensionsInstalls.remoteSSH ? '(Remote Development extension is not installed)' : ''}` },
        ];

        let selectedProjectTypePick = await vscode.window.showQuickPick(projectTypePicks, {
            placeHolder: "Project Type",
        });

        if (selectedProjectTypePick == null) {
            throw new Error(USER_CANCELED);
        }

        if (defaultPath != null) {
            defaultPath = defaultPath.replace(REMOTE_REGEX, ''); // 'Trim vscode-remote://REMOTE_TYPE+'
        }

        switch (selectedProjectTypePick.id) {
            case 'dir':
                return await getPathFromPicker(true, defaultPath);
            case 'file':
                return await getPathFromPicker(false, defaultPath);
            case 'ssh':
                return await getSSHPath(defaultPath);
            default:
                throw new Error(USER_CANCELED);
        }
    }

    async function getPathFromPicker(folderProject: boolean, defaultPath: string = null): Promise<string> {
        var defaultUri: vscode.Uri = undefined;
        if (defaultPath) {
            defaultUri = vscode.Uri.parse(defaultPath);
        }

        // Path
        let selectedProjectUris = await vscode.window.showOpenDialog({
            defaultUri,
            openLabel: `Select ${folderProject ? 'Folder' : 'File'} as Project`,
            canSelectFolders: folderProject,
            canSelectFiles: !folderProject,
            canSelectMany: false,
        });

        if (selectedProjectUris == null || selectedProjectUris[0] == null) {
            throw new Error(USER_CANCELED);
        }

        return selectedProjectUris[0].fsPath.trim();
    }

    async function getSSHPath(defaultPath: string = null): Promise<string> {
        let remotePath = await vscode.window.showInputBox({
            placeHolder: 'user@target.xyz/home/optional-folder',
            value: defaultPath || undefined,
            ignoreFocusOut: true,
            prompt: "SSH remote, target folder is optional",
            validateInput: (val: string) => SSH_REGEX.test(val) ? '' : 'A valid SSH Target must be proviced',
        });

        if (!remotePath) {
            throw new Error(USER_CANCELED);
        }

        remotePath = `${SSH_REMOTE_PREFIX}${remotePath}`;
        return remotePath.trim();
    }

    function buildColorText(colorCode: string, colorName: string = null): string {
        if (colorCode == null) {
            return "";
        }

        // If color is predefined, use this label only.
        let predefColor = PREDEFINED_COLORS.find(c => c.value === colorCode);
        if (predefColor) {
            return predefColor.label;
        }

        // If it has a color, aggregate colorCode and name
        colorName = colorName || getColorName(colorCode);
        let colorText = colorName ? `${colorName}    (${colorCode})` : colorCode;

        return colorText;
    }

    async function queryProjectColor(projectTemplate: Project = null): Promise<string> {
        var color: string = null;
        if (!USE_PROJECT_COLOR) {
            return null;
        }

        if (projectTemplate != null) {
            color = projectTemplate.color;
        }

        // Colors are keyed by label, not by value
        // I tried to key them by their value, but the selected QuickPick was always undefined,
        // even when sanitizing the values (to alphanumeric only)
        let colorPicks = PREDEFINED_COLORS.map(c => ({
            id: c.label,
            label: c.label,
        }));
        colorPicks.unshift({ id: FixedColorOptions.random, label: 'Random Color' });
        colorPicks.unshift({ id: FixedColorOptions.custom, label: '> Custom Color' });
        colorPicks.unshift({ id: FixedColorOptions.recent, label: '> Recent Colors' });
        if (!projectTemplate || projectTemplate.color) {
            colorPicks.push({ id: FixedColorOptions.none, label: 'None' });
        }

        if (projectTemplate) {
            if (!projectTemplate.color) {
                colorPicks.unshift({
                    id: FixedColorOptions.none,
                    label: `Current: None`,
                });
            } else {
                // Get existing color name by value
                let color = PREDEFINED_COLORS.find(c => c.value === projectTemplate.color);
                let existingEntryIdx = !color ? -1 : colorPicks.findIndex(p => p.id === color.label);

                // If color is already in quicklist, remove it
                if (existingEntryIdx !== -1) {
                    colorPicks.splice(existingEntryIdx, 1)[0];
                }

                colorPicks.unshift({
                    id: projectTemplate.color,
                    label: `Current: ${buildColorText(projectTemplate.color)}`,
                });
            }
        }

        do {
            color = null;
            let selectedColorPick = await vscode.window.showQuickPick(colorPicks, {
                placeHolder: 'Project Color',
            });

            if (selectedColorPick == null) {
                throw new Error(USER_CANCELED);
            }

            switch (selectedColorPick.id) {
                case FixedColorOptions.custom:
                    let customColor = await vscode.window.showInputBox({
                        placeHolder: '#cc3344   crimson   rgb(68, 145, 203)   linear-gradient(to right, gold, darkorange)',
                        ignoreFocusOut: true,
                        prompt: "Any color name, value or gradient.",
                    });

                    color = (customColor || "").replace(/[;"]/g, "").trim();
                    break;
                case FixedColorOptions.recent:
                    let recentColors = getRecentColors(context);
                    let recentColorPicks = recentColors.map(([code, name]) => ({
                        id: code,
                        label: buildColorText(code, name),
                    }));

                    recentColorPicks.unshift({
                        id: null,
                        label: "(Back)",
                    })

                    let selectedRecentColor = await vscode.window.showQuickPick(recentColorPicks, {
                        placeHolder: recentColorPicks.length ? 'Recent Color' : 'No colors have recently been used.',
                        ignoreFocusOut: true,
                    });

                    // if (selectedRecentColor == null) {
                    //     throw new Error(USER_CANCELED);
                    // }
                    if (selectedRecentColor != null) {
                        color = selectedRecentColor.id;
                    }
                    break;
                case FixedColorOptions.none:
                    return null; // Only case to allow null color
                case FixedColorOptions.random:
                    color = getRandomColor();
                    break;
                default:
                    // PredefinedColor
                    let predefinedColor = PREDEFINED_COLORS.find(c => c.label == selectedColorPick.id || c.value == selectedColorPick.id);
                    if (predefinedColor != null) {
                        color = predefinedColor.value;
                    } else {
                        color = selectedColorPick.id;
                    }
            }
        } while (!color);

        return color;
    }

    async function removeProjectPerCommand() {
        var projects = getProjectsFlat(context);
        let projectPicks = projects.map(p => ({ id: p.id, label: p.name }));

        let selectedProjectPick = await vscode.window.showQuickPick(projectPicks);

        if (selectedProjectPick == null)
            return;

        await removeProject(context, selectedProjectPick.id)
        showDashboard();
    }

    async function editProjectsManuallyPerCommand() {
        var projects = getProjects(context);
        const tempFilePath = getProjectsTempFilePath();
        try {
            writeTextFile(tempFilePath, JSON.stringify(projects, null, 4));
        } catch (e) {
            vscode.window.showErrorMessage(`Can not write temporary project file under ${tempFilePath}
            ${e.message ? ': ' + e.message : '.'}`);
            return;
        }

        const tempFileUri = vscode.Uri.file(tempFilePath);

        var editProjectsDocument = await vscode.workspace.openTextDocument(tempFileUri);

        await vscode.window.showTextDocument(editProjectsDocument);

        var subscriptions: vscode.Disposable[] = [];
        var editSubscription = vscode.workspace.onWillSaveTextDocument(async (e) => {
            if (e.document == editProjectsDocument) {
                let updatedGroups;
                try {
                    var text = e.document.getText() || "[]";
                    updatedGroups = JSON.parse(text);
                } catch (ex) {
                    vscode.window.showErrorMessage("Edited Projects File can not be parsed.")
                    return;
                }

                // Validate and Cleanup
                var jsonIsInvalid = false;
                if (Array.isArray(updatedGroups)) {
                    for (let group of updatedGroups) {
                        if (group.name && !group.groupName) {
                            // One of the testers produced a group with any groupName
                            // We could not reproduce that, but this may be a result from updating legacy groups
                            // This should fix that issue
                            group.groupName = group.name;
                            delete group.name;
                        }

                        if (group && group.groupName == null && (group.projects == null || !group.projects.length)) {
                            // Remove empty, unnamed group
                            group._delete = true;
                        } else if (!group || !group.id || group.groupName == undefined || !group.projects || !Array.isArray(group.projects)) {
                            jsonIsInvalid = true;
                            break;
                        } else {
                            for (let project of group.projects) {
                                if (!project || !project.id || !project.name || !project.path) {
                                    jsonIsInvalid = true;
                                    break;
                                }

                                // Remove obsolete properties
                                delete project.imageFileName;
                            }
                        }
                    }
                } else {
                    jsonIsInvalid = true;
                }

                if (jsonIsInvalid) {
                    vscode.window.showErrorMessage("Edited Projects File does not meet the Schema expected by Dashboard.");
                    return;
                }

                updatedGroups = updatedGroups.filter(g => !g._delete);

                await saveGroups(context, updatedGroups);
                showDashboard();

                subscriptions.forEach(s => s.dispose());
                // await deleteFile(tempFilePath); // Deleting file does not make sense, as the file gets immidiately saved again after this listener

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

    async function deleteProject(projectId: string) {
        var project = getProject(context, projectId);
        if (project == null) {
            return;
        }

        let accepted = await vscode.window.showWarningMessage(`Delete ${project.name}?`, { modal: true }, 'Delete');
        if (!accepted) {
            return;
        }

        await removeProject(context, projectId);
        showDashboard();
    }

    async function reorderGroups(groupOrders: GroupOrder[]) {
        var groups = getProjects(context);

        if (groupOrders == null) {
            vscode.window.showInformationMessage('Invalid Argument passed to Reordering Projects.');
            return;
        }


        // Map projects by id for easier access
        var projectMap = new Map<string, Project>();
        for (let group of groups) {
            if (group.projects == null) {
                continue;
            }

            for (let project of group.projects) {
                projectMap.set(project.id, project);
            }
        }

        // Build new, reordered projects group array
        var reorderedGroups: Group[] = [];
        for (let { groupId, projectIds } of groupOrders) {
            let group = groups.find(g => g.id === groupId);
            if (group == null) {
                group = new Group("Group #" + (reorderedGroups.length + 1));
            }

            group.projects = projectIds.map(pid => projectMap.get(pid)).filter(p => p != null);
            reorderedGroups.push(group);
        }

        await saveGroups(context, reorderedGroups);
        showDashboard();
    }

    function isFolderGitRepo(fPath: string) {
        try {
            fPath = lstatSync(fPath).isDirectory() ? fPath : path.dirname(fPath);
            var test = execSync(`cd ${fPath} && git rev-parse --is-inside-work-tree`, { encoding: 'utf8' });
            return !!test;
        } catch (e) {
            return false;
        }
    }

    function getProjectsTempFilePath(): string {
        var savePath = context.globalStoragePath;
        return `${savePath}/Dashboard Projects.json`;
    }

    function getLastPartOfPath(path: string): string {
        if (!path) {
            return "";
        }
        // get last folder of filename of path/remote
        path = path.replace(REMOTE_REGEX, ''); // Remove remote prefix
        path = path.replace(/^\w+\@/, ''); // Remove Username
        let lastPart = path.replace(/^[\\\/]|[\\\/]$/g, '').replace(/^.*[\\\/]/, '');

        return lastPart;
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}

