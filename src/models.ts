'use strict';
import * as vscode from 'vscode';

export interface IDashboardConfig {
    stylesPath: vscode.Uri;
    projects: Project[];
}

export interface FileInfo {
    name: string;
    type: string;
    size: number;
    content: Uint8Array;
}

export class Project {
    id: string;
    name: string;
    path: string;
    imageFilePath: string;
}