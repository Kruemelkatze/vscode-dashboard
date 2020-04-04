import BaseService from "./baseService";
import * as fs from 'fs';
import * as path from 'path';

export default class FileService extends BaseService {

    removeFile(filePath: string) {
        filePath = path.normalize(filePath);
        //Promise to keep all file modifications returning a Promise
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, err => {
                err ? reject(err) : resolve();
            });
        });
    }

    writeTextFile(filePath: string, data: string) {
        this.writeFile(filePath, data, 'utf8');
    }

    writeFile(filePath: string, data: any, encoding: string = undefined) {
        filePath = path.normalize(filePath);

        var dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        fs.writeFileSync(filePath, data, encoding);
    }
}