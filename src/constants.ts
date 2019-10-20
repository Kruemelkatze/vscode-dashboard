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

export const StartupOptions = Object.freeze({
    always: "always",
    emptyWorkSpace: "empty workspace",
    never: "never",
});

export const FixedColorOptions = Object.freeze({
    random: 'Random',
    none: 'None',
    custom: 'Custom',
});

export const USER_CANCELED = "CanceledByUser"; // A symbol would be nice, but throw new Error(Symbol) does not work

export const ADD_NEW_PROJECT_TO_FRONT = false;