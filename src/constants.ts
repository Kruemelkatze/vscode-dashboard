export const USE_PROJECT_COLOR = true;
export const PREDEFINED_COLORS = [
    { label: 'Green', value: 'var(--vscode-gitDecoration-untrackedResourceForeground)' },
    { label: 'Brown', value: 'var(--vscode-gitDecoration-modifiedResourceForeground)' },
    { label: 'Red', value: 'var(--vscode-gitDecoration-deletedResourceForeground)' },
    { label: 'Grey', value: 'var(--vscode-gitDecoration-ignoredResourceForeground)' },
    { label: 'Dark Blue', value: '#6c6cc4' }, // Color was changed in https://github.com/microsoft/vscode/commit/2fda718ad7136a145668dad783b7ee41c58b6737
    { label: 'Light Blue', value: 'var(--vscode-terminal-submoduleResourceForeground)' },
];

export const PROJECTS_KEY = 'projects';
export const RECENT_COLORS_KEY = 'recentColors';
export const REOPEN_KEY = 'reopenDashboardReason';

export const FITTY_OPTIONS = {
    maxSize: '40',
    // minSize: '20', // Apparently, fitty has a problem with our setup and will overflow text if minSize is set...
}

export const USER_CANCELED = "CanceledByUser"; // A symbol would be nice, but throw new Error(Symbol) does not work
export const ADD_NEW_PROJECT_TO_FRONT = false;

export const SSH_REMOTE_PREFIX = "vscode-remote://ssh-remote+";
export const REMOTE_REGEX = /^vscode-remote:\/\/[^\+]+\+/;
export const SSH_REGEX = /^((?<user>[^@\/]+)(\@))?(?<hostname>[^@\/\. ]+[^@\/ ]*)(?<folder>\/.*)*$/;

export const StartupOptions = Object.freeze({
    always: "always",
    emptyWorkSpace: "empty workspace",
    never: "never",
});

export const FixedColorOptions = Object.freeze({
    random: 'Random',
    none: 'None',
    custom: 'Custom',
    recent: 'Recent',
});

export const RelevantExtensions = Object.freeze({
    remoteSSH: 'ms-vscode-remote.remote-ssh',
});