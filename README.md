# vscode-dashboard

**vscode-dashboard** is a Visual Studio Code extension that lets you organize your projects/workspaces in a speed-dial like manner. Pin your frequently visited folders and files onto a dashboard to access them quickly.

![](screenshot.png)

## Usage
The dashboard is a dedicated webview inside vscode that is opened when the welcome page is shown. It can also be opened via command. Clicking a project opens it in the current window, while strg+click opens it in a new window.

Adding a workspace or file (project) can be done via command or button. First a project type (folder or file/multi-workspace) has to be selected. You are then prompted to provide a name, path and an optional color. 

Projects can also be separated into **project groups**. When adding a new project, you are prompted to select an existing group or create a new one.

Editing the project list currently has to be done manually by editing a JSON file.

### Commands
The commands should speak for themselves. :)
* Dashboard: Open (ctrl + f1)
* Dashboard: Add Project
* Dashboard: Edit Projects
* Dashboard: Remove Project



## Changelog
[View Changelog](CHANGELOG.md)

## Notes
* Emojis may (or may not, depending on your preference) be good icons for projects. You can add them by pressing WIN + . (under Windows) while naming the project.
* Only colors defined by the theme were used. So the dashboard should always blend nicely into your VSCode design. 