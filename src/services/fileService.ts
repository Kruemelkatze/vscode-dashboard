import BaseService from "./baseService";
import * as fs from 'fs';
import * as path from 'path';
import { ProjectPathType } from "../models";

export default class FileService extends BaseService {

    async removeFile(filePath: string): Promise<void> {
        filePath = path.normalize(filePath);
        await fs.promises.unlink(filePath);
    }

    async writeTextFile(filePath: string, data: string): Promise<void> {
        return this.writeFile(filePath, data, 'utf8');
    }

    async writeFile(filePath: string, data: any, encoding: string = undefined): Promise<void> {
        filePath = path.normalize(filePath);
        var dir = path.dirname(filePath);

        await new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        await fs.promises.writeFile(filePath, data, encoding);
    }

    async getProjectPathType(p: string): Promise<ProjectPathType> {
        let stats = await fs.promises.lstat(p);
        if (stats.isDirectory()) {
            return ProjectPathType.Folder;
        }

        let isVSCodeWorkspaceFile = p.toLowerCase().endsWith(".code-workspace");
        return isVSCodeWorkspaceFile ? ProjectPathType.WorkspaceFile : ProjectPathType.File;
    }

    async getFoldersFromWorkspaceFile(p: string): Promise<string[]> {
        let content = await fs.promises.readFile(p, "utf8");
        let json = JSON.parse(content) as { folders: { path: string }[] };
        let folder = path.dirname(p);
        let folderPaths = json.folders.map(f => path.join(folder, f.path));
        return folderPaths;
    }


    isFile(p: string): boolean {
        return !!path.extname(p);
    }
}