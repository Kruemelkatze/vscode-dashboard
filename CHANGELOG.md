# Change Log
All notable changes to the "dashboard" extension will be documented in this file. It follows the [Keep a Changelog](http://keepachangelog.com/) recommendations.

## [1.5] t.b.d.
### Added
- Support for [Remote Development Projects](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack).
- Added config for startup behaviour.
- Editing and rearranging projects groups directly on the dashboard.
- Option for storing projects in the User Settings (to be synced via [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)).

### Changed
- Default option for color is now 'Random', as most people use colors. :-)
- Editing a project via UI now also prompts for editing its path.
- Reduced number of message from the extension.

### Fixed
- Fixed some exceptions thrown when user cancelled any input (by pressing esc or unfocusing the window).
- Fixed a bug that made the dashboard not open automatically because of a hidden file of the ***Code Runner*** extension.

## [1.4.1] 2019-07-11
### Fixed
- Fixed issue that nothing shows on the dashboard, if a user updates from 1.2.0 to 1.4.0 with only an empty, unnamed project group.

## [1.4] 2019-07-07
### Added
- Support for gradient borders.

### Changed
- Removed color input validation in order to support any color definition.

### Fixed
- Editing projects now correctly sets color.

## [1.3] 2019-06-27
### Added
- Editing functionality directly on Dashboard
    - Reordering by drag & drop 
    - Edit button
    - Delete button
- Setting for editing project temp file location
- Prefill project name from selected path
- ```displayProjectPath``` setting

### Changed
- When editing the dashboard manually, empty unnamed groups are removed after saving.
- Removed "Blank Page" icon of dashboard.

## [1.2] 2018-12-06
### Added
- Project Groups
- Color Customization Options in settings
- Detect if project is a Git repository. If so, display an icon.

### Changed
- When adding a project, a project group has to be selected.

## [1.1] 2018-09-25
### Added
- Support for Multi-Root Workspaces

### Changed
- When adding a project, a project type (folder or file/multi-workspace) has to be selected at first.

### Fixed
- Editing Projects now works under Linux (moved to another temp path)

## [1.0.0] 2018-09-23
 **First official release!**

### Added
- Ctrl + F1 as default keybinding for Dashboard: Open command

### Fixed
- Add project button now works when no projects are in the dashboard

# Pre-releases
## [0.2.0] 2018-09-18
### Added
- Project name scales to fit card
- Long project paths are truncated (left)
- Ctrl + Click on project opens the project in a new window
- If project is already opened, an info message is shown

### Changes
- When editing the projects file, the file is closed after save

## [0.1.3] 2018-09-09
### Added
- Add project button

### Fixed
- Clicking on newly added projects now works

## [0.1.2] 2018-09-06
### Added
- Extension information and icon

## [0.1.1] 2018-09-06
- Initial pre-release