# vscode-dashboard

**vscode-dashboard** is a Visual Studio Code extension that lets you organize your projects in a speed-dial like manner. Pin your frequently visited **folders**, **files** or **SSH remotes** onto a dashboard to access them quickly.

![demo-screenshot](screenshot.png)

## Usage

The dashboard is a dedicated UI that can be opened using a command or ***CTRL + F1*** and configured to open automatically. Clicking a project opens it in the current window, while ***ctrl + click*** (***cmd + click*** on Mac) opens it in a new window.

Adding a project can be done via command or button. First a project type (folder or file/multi-workspace or SSH remote) has to be selected. You are then prompted to provide a name, path and an optional color. Projects can also be separated into **project groups**. When adding a new project, you are prompted to select an existing group or create a new one.

Projects and project groups can be added, edited, deleted and reordered **directly on the dashboard**. For manual control, you can also edit them  by editing a JSON file (using the ***Dashboard: Edit Projects*** command).

## Good to know
* You can **edit** and **reorder** projects and project groups directly on the dashboard.
* **Emojis** may (or may not, depending on your preference) be good icons for projects. You can add them by pressing WIN + . (under Windows) while naming the project.
* **Gradients** can also be used as project color. You can add them using CSS Gradient functions like linear-gradient and radial-gradient.
* Only **colors** defined by the theme were used. So the dashboard should always blend nicely into your VSCode design. If not, you can customize them in the settings.
* vscode-dashboard automatically detects if a project is a **Git repository**. If so, this is indicated by an icon.

## Configuration

The dashboard can be configured and customized using the vscode configuration:

* Projects are stored in the globalState by default (saved on machine), but can be set to be saved in the settings (to be synced via [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)) instead. Note that by doing so, you remove the possiblity of having varying dashboards on your synced devices.
* Startup behaviour (open always, on empty editor, or never)
* Placement of '+' button
* Visibility of project path
* Colors (see below)

By default, dashboard uses only colors defined by the theme, which was tested against all default themes. If you use a custom theme and see the dashboard's colors unfit, you can change them in the settings (Settings > Dashboard). Following settings can be changed to any css color (name, hex, rgba, hsl, var) or left empty (for default):

* Project Card Background
* Project Name Color
* Project Path Color


## Changelog

[View Changelog](CHANGELOG.md)


## Acknowledgements
Special thanks to [Font Awesome](http://fontawesome.io) [(License)](https://fontawesome.com/license) for the icons used in the dashboard.
