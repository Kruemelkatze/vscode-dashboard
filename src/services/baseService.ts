import * as vscode from 'vscode';

export default abstract class BaseService {
    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    get configurationSection(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration('dashboard');
    }

    useSettingsStorage(): boolean {
        return this.configurationSection.get('storeProjectsInSettings');
    }

}