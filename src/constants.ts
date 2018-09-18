// Should Icons really be included? Apart from technical difficulties (Security Policies, etc.), most projects won't have one.
export const USE_PROJECT_ICONS = false;
// Alternative: Colored bar on project card
export const USE_PROJECT_COLOR = true;
export const PREDEFINED_COLORS = [
    { label: 'Green', value: 'var(--vscode-gitDecoration-untrackedResourceForeground)' },
    { label: 'Brown', value: 'var(--vscode-gitDecoration-modifiedResourceForeground)' },
    { label: 'Red', value: 'var(--vscode-gitDecoration-deletedResourceForeground)' },
    { label: 'Grey', value: 'var(--vscode-gitDecoration-ignoredResourceForeground)' },
    { label: 'Dark Blue', value: 'var(--vscode-gitDecoration-conflictingResourceForeground)' },
    { label: 'Light Blue', value: 'var(--vscode-gitDecoration-submoduleResourceForeground)' },
];
export const FITTY_OPTIONS = {
    maxSize: '40',
    // minSize: '20', // Apparently, fitty has a problem with our setup and will overflow text if minSize is set...
}

export const ADD_NEW_PROJECT_TO_FRONT = false;
export const PROJECTS_FILE = "projects.json";
export const PROJECT_IMAGE_FOLDER = "media/projects";
export const DATA_ROOT_PATH = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local')) + '/vscode-dashboard';