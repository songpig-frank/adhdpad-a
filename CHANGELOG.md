# ADHDPad Changelog

All notable changes to this project will be documented in this file.

## Project Information
- Project Path: `/Volumes/ExtDrv/cursor_builds/adhdpad-a`
- Development Environment: macOS (darwin 24.2.0)
- AI Assistant: Cursor AI (Claude 3.5 Sonnet)

## Development Environment Changes [2024-01-21]
- **[8:57 AM - 10:27 AM PST]** - Vite Server Updates
  - Vite version progression: v5.0.0 → v5.4.14 → v6.0.11
  - Port migrations: 5173 → 5174 → 5175 → 5176
  - Fixed dependency issues with node modules
  - Server stability improvements

## Bug Fixes

### [2024-01-21]
- **[10:27 AM PST]** - Added loading indicators and auto-refresh for task list
  - Branch: `adhdpad-a`
  - Fixed issue where users couldn't tell if task was being saved
  - Added visual feedback during task saving process
  - Implemented automatic list refresh after saving
  - Added timestamp-based sorting for newest tasks
  - Technical: Added isSaving state, loading spinners, and automatic refresh after save
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

### [2024-01-21]
- **[10:30 AM PST]** - Three-dot menu improvements (✓ Fixed)
  - Branch: `adhdpad-a`
  - Fixed: Menu now closes on mouse out
  - Fixed: Menu positioning restored to right side, vertically centered
  - Fixed: Improved menu interaction and transitions
  - Status: Completed
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

### [2024-01-21]
- **[11:45 AM PST]** - Task Attachments & Links Implementation
  - Branch: `adhdpad-a`
  - Status: In Progress
  - Features Added:
    - URL validation and preview
    - File attachment preview
    - Drag & drop support
    - Right-click paste support
    - Attachment display in tasks
    - File size display
    - Link preview with domain name
    - Attachment removal functionality
  - Technical Details:
    - Added attachment state management
    - Implemented URL validation
    - Added file preview generation
    - Added attachment cleanup on unmount
    - Improved UI/UX for attachments
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

### [2024-01-21]
- **[12:15 PM PST]** - Attachment Viewing & Size Limit Fixes
  - Branch: `adhdpad-a`
  - Fixed: Attachments now open in new window correctly
  - Added: 10MB file size limit for uploads
  - Added: Firebase Storage integration for file persistence
  - Technical Details:
    - Implemented Firebase Storage upload
    - Added proper file URL storage and retrieval
    - Added file size validation
    - Fixed attachment preview links
  - Status: Completed
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

### [2024-01-21]
- **[12:20 PM PST]** - Fixed CORS Issues with File Uploads
  - Branch: `adhdpad-a`
  - Fixed: CORS errors when uploading files to Firebase Storage
  - Added: Firebase Storage rules for development
  - Added: Proper CORS headers and metadata configuration
  - Technical Details:
    - Added storage.rules configuration
    - Updated Firebase Storage initialization
    - Added CORS metadata to file uploads
    - Fixed file upload error handling
  - Status: Completed
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

### [2024-01-21]
- **[2:00 PM PST]** - Enhanced Firebase Storage Configuration
  - Branch: `adhdpad-a`
  - Fixed: CORS configuration for Firebase Storage bucket
  - Added: Support for all localhost ports in development
  - Added: Proper storage rules for authenticated and unauthenticated access
  - Technical Details:
    - Updated storage rules to allow uploads from any localhost port
    - Added content type validation for images and applications
    - Fixed metadata handling in file uploads
    - Deployed updated CORS and storage rules
  - Status: Completed
  - AI Used: Cursor AI (Claude 3.5 Sonnet)

## Planned Fixes
- Task list sorting persistence
- Improved error handling for failed API calls
- Firebase Storage integration for file uploads
- Mobile image upload optimization
- URL preview generation with metadata
- Thumbnail generation for images

## Format Guide for Future Entries

### [YYYY-MM-DD]
- **[HH:MM AM/PM TZ]** - Brief Title
  - Branch: `branch-name`
  - Description of what was fixed
  - Technical details if relevant
  - Impact of the fix
  - Related issues or PRs
  - AI Used: [AI Model Name] 