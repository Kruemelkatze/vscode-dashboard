# Change Log

All notable changes to the "Project Dashboard" extension will be documented in this file. It follows the [Keep a Changelog](http://keepachangelog.com/) recommendations.

## [2.5.2] 2022-04-12

### Added

-   Fallbacks for inbuilt colors if they are not set or changed. This happens in restricted mode or due to changes in vscode.

### Fixed

-   Extension is now configured to not require workspace trust.

## [2.5.1] 2022-01-07

### Fixed

-   Middle mouse button now opens project in new window even when it is used for scrolling.

## [2.5.0] 2021-11-24

### Added

-   Added a filtering option, toggled by CTRL + F.
-   Added an option controlling '+ New Group' visibility in the dashboard.

### Fixed

-   Webview now scrolls when project or group is dragged to window bounds.
-   Dragging can be canceled by pressing ESC.

## [2.4.0] 2021-08-11

### Added

-   Clicking a project with the middle mouse button opens it in a new tab.

### Fixed

-   Fixed grammar. :)

## [2.3.2] 2021-07-16

### Changed

-   Set `extensionKind` to `["ui", "workspace"]`, following [https://github.com/Kruemelkatze/vscode-dashboard/issues/65](https://github.com/Kruemelkatze/vscode-dashboard/issues/65).

## [2.3.1] 2020-11-23

### Changed

-   Upon clicking the sidebar icon, the sidebar view switches to the explorer instead of closing itself. This fixes an unrecoverable state when the dashboard view is placed under another sidebar view container.

## [2.3.0] 2020-11-23

### Added

-   Sidebar icon for opening the project dashboard.

### Changed

-   The dashboard now has a dedicated icon.

## [2.2.2] 2020-07-03

### Fixed

-   Editing dashboard.projectData in settings does not wrongly format null value any more.

## [2.2.1] 2020-05-13

### Fixed

-   Opening remote SSH folder projects.
-   Opening remote projects in new window.

## [2.2.0] 2020-05-12

### Changed

-   Allow any characters in SSH remote string.
-   Renamed _File or Multi-Root Project_ to _Workspace or File Project_.

### Fixed

-   Null safe group sanitizing.

## [2.1.2] 2020-04-29

### Changed

-   Allow loading external images in webview.

## [2.1.1] 2020-04-29

### Fixed

-   Fixed editing projects manually.
-   Strip HTML tags from project name when adding it to the workspace.

## [2.1.0] 2020-04-21

### Added

-   "Add Project to Workspace" context menu action for folders and multi-root workspaces.

### Changed

-   When adding a file or folder project, the file system picker is set to the current workspace per default.

## [2.0.2] 2020-04-13

### Fixed

-   Fixed Storage Consistency.

## [2.0.1] 2020-04-11

### Fixed

-   Context Menu is now correctly placed when the Dashboard is scrolled.

## [2.0.0] 2020-04-11

### Changed

-   Renamed extension to **Project Dashboard**.
-   Project and Group Management
    -   'Project Groups' are now referred to as only 'Groups'.
    -   Empty groups are no longer removed.
    -   Groups can now be added by a dedicated button.
    -   When adding a project using any + button in the group, user is now longer prompted to select a group.
    -   Editing project no longer includes editing the color. For this, a dedicated action was added.
    -   Reordered group actions to be consistent with project actions.
-   Colors
    -   Random colors are now selected from a large array of colours, not only from the limited set of default colors.
-   All animations have now an equal duration. Delay for actions has been lowered to 250ms.

### Added

-   Groups can be collapsed
-   Context menus for projects and groups that include all actions.
-   Colors
    -   Project color can now be changed directly from the dashboard without going through the whole project editing phase.
    -   Selection for recently used colors.
    -   Custom colors are now named using [Name that Color](http://chir.ag/projects/name-that-color/#6195ED).
    -   Custom Project Card background now allows for any CSS background value.
-   Setting for project tile width.

### Fixed

-   Changing the data source (globalState or user settings) now directly migrates the data and updates the dashboard.

### Internal

-   Refactored Webview
-   Refactored Services

## [1.5.5] 2019-11-09

### Fixed

-   Fixed all css transitions firing on opening dashboard, triggered by a bug in the Chromium version used by VSCode 1.40.0.

## [1.5.4] 2019-11-08

### Fixed

-   Fixed error on opening file/folder dialog on VSCode 1.40.0

## [1.5.3] 2019-11-06

### Fixed

-   Cmd + click for opening in new window on Mac.

### Internal

-   Extension package is now significantly smaller.

## [1.5.2] 2019-10-25

### Fixed

-   Dashboard settings are now correctly fetched without restarting.

## [1.5.1] 2019-10-24

### Changed

-   Group name is now mandatory, as the group name is always displayed. So enforcing a name makes sense.

### Fixed

-   Escape/Unfocus on entering group name now cancels the add/edit action instead of having an unnamed group.

## [1.5] 2019-10-22

### Added

-   Support for [Remote Development Projects](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack).
-   Added config for startup behaviour (always, empty workspace, never).
-   Editing and rearranging projects groups directly on the dashboard.
-   Option for storing projects in the User Settings (to be synced via [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)).
-   Setting for removing the big '+' button, but added a smaller one next to the group name.

### Changed

-   Default option for color is now 'Random', as most people use colors. :-)
-   Editing a project via UI now also prompts for editing its path.
-   Reduced number of message from the extension.
-   Temporary file for editing is now safely placed in the [Global storage path](https://code.visualstudio.com/updates/v1_31#_global-storage-path). This also removed the need for the custom temp file location setting.
-   Indicated Dashboard as "ui"-type extension, so that it works without installing if a remote workspace (SSH, WSL, Container) is opened in VSCode.

### Fixed

-   Fixed some exceptions thrown when user cancelled any input (by pressing esc or unfocusing the window).
-   Fixed a bug that made the dashboard not open automatically because of a hidden file of the **_Code Runner_** extension.

## [1.4.1] 2019-07-11

### Fixed

-   Fixed issue that nothing shows on the dashboard, if a user updates from 1.2.0 to 1.4.0 with only an empty, unnamed group.

## [1.4] 2019-07-07

### Added

-   Support for gradient borders.

### Changed

-   Removed color input validation in order to support any color definition.

### Fixed

-   Editing projects now correctly sets color.

## [1.3] 2019-06-27

### Added

-   Editing functionality directly on Dashboard
    -   Reordering by drag & drop
    -   Edit button
    -   Remove button
-   Setting for editing project temp file location
-   Prefill project name from selected path
-   `displayProjectPath` setting

### Changed

-   When editing the dashboard manually, empty unnamed groups are removed after saving.
-   Removed "Blank Page" icon of dashboard.

## [1.2] 2018-12-06

### Added

-   Groups
-   Color Customization Options in settings
-   Detect if project is a Git repository. If so, display an icon.

### Changed

-   When adding a project, a group has to be selected.

## [1.1] 2018-09-25

### Added

-   Support for Multi-Root Workspaces

### Changed

-   When adding a project, a project type (folder or file/multi-workspace) has to be selected at first.

### Fixed

-   Editing Projects now works under Linux (moved to another temp path)

## [1.0.0] 2018-09-23

**First official release!**

### Added

-   Ctrl + F1 as default keybinding for Dashboard: Open command

### Fixed

-   Add project button now works when no projects are in the dashboard

# Pre-releases

## [0.2.0] 2018-09-18

### Added

-   Project name scales to fit card
-   Long project paths are truncated (left)
-   Ctrl + Click on project opens the project in a new window
-   If project is already opened, an info message is shown

### Changes

-   When editing the projects file, the file is closed after save

## [0.1.3] 2018-09-09

### Added

-   Add project button

### Fixed

-   Clicking on newly added projects now works

## [0.1.2] 2018-09-06

### Added

-   Extension information and icon

## [0.1.1] 2018-09-06

-   Initial pre-release
