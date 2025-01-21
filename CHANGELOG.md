# ADHDPad Changelog

All notable changes to this project will be documented in this file.

## Project Information
- Project Path: `/Volumes/ExtDrv/cursor_builds/adhdpad-a`
- Development Environment: macOS (darwin 24.2.0)

## Development Environment Changes [2024-01-21]
- **[8:57 AM - 10:27 AM PST]** - Vite Server Updates
  - Vite version progression: v5.0.0 → v5.4.14 → v6.0.11
  - Port migrations: 5173 → 5174 → 5175 → 5176
  - Fixed dependency issues with node modules
  - Server stability improvements

## Bug Fixes

### [2024-01-21]
- **[10:27 AM PST]** - Added loading indicators and auto-refresh for task list
  - Branch: `main`
  - Fixed issue where users couldn't tell if task was being saved
  - Added visual feedback during task saving process
  - Implemented automatic list refresh after saving
  - Added timestamp-based sorting for newest tasks

### [2024-01-21]
- **[10:30 AM PST]** - Three-dot menu improvements (In Progress)
  - Branch: `main`
  - Issue: Menu doesn't close on mouse out or after action
  - Status: Pending fix
  - Priority: Medium
  - Impact: UX improvement needed for menu interaction

## Planned Fixes
- Menu closing behavior after state changes
- Menu auto-close on mouse out
- Task list sorting persistence
- Improved error handling for failed API calls

## Format Guide for Future Entries

### [YYYY-MM-DD]
- **[HH:MM AM/PM TZ]** - Brief Title
  - Branch: `branch-name`
  - Description of what was fixed
  - Technical details if relevant
  - Impact of the fix
  - Related issues or PRs 