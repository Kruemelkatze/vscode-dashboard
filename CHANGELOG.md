# Change Log
All notable changes to the "dashboard" extension will be documented in this file. It follows the [Keep a Changelog](http://keepachangelog.com/) recommendations.

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