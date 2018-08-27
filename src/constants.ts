// Should Icons really be included? Apart from technical difficulties (Security Policies, etc.), most projects won't have one.
export const USE_PROJECT_ICONS = false;
// Alternative: Colored bar on project card
export const USE_PROJECT_COLOR = true; 

export const ADD_NEW_PROJECT_TO_FRONT = false;
export const SAVE_PROJECTS_IN_FILE = false;
export const PROJECTS_FILE = "projects.json";
export const PROJECT_IMAGE_FOLDER = "media/projects";
export const DATA_ROOT_PATH = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')) + '/vscode-dashboard';