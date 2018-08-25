export const ADD_NEW_PROJECT_TO_FRONT = false;
export const SAVE_PROJECTS_IN_FILE = false;
export const PROJECTS_FILE = "projects.json";
export const PROJECT_IMAGE_FOLDER = "media/projects";
export const DATA_ROOT_PATH = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')) + '/vscode-dashboard';