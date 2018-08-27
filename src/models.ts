'use strict';

export class Project {
    id: string;
    name: string;
    path: string;
    imageFileName: string;

    constructor(name: string, path: string, imageFileName: string = null) {
        this.id = generateRandomId(name);
        this.name = name;
        this.path = path;
        this.imageFileName = imageFileName;
    }
}

function generateRandomId(prepend: string = null) {
    if (prepend) {
        prepend = prepend.toLowerCase().replace(/[^a-z0-9]/, '').substring(0, 24);
    } else {
        prepend = '';
    }

    return prepend + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}