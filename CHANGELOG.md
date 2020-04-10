# Change Log

All notable changes to the "Project Dashboard" extension will be documented in this file. It follows the [Keep a Changelog](http://keepachangelog.com/) recommendations.

## [2.0.0] 2020-04-10

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
