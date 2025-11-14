# netsuite-field-finder
NetSuite Field Finder

## Summary

A Chrome & Firefox browser extension for NetSuite that allows users to quicky find fields in Saved Searches and Workflows by filtering the list of fields to specific types or search for a field name or field ID. It also improves the field dropdown listing to provide more details about the field.

## Release Notes

### 0.36
- Fix an issue where extension could not initialize in Firefox browsers

### 0.35
- Fix an issue related to multiselect where when inserting a new line between existing lines and then using multiselect would result in the selected field being added to end of all lines and resulting in an empty line in the middle. NS would then prompt user to enter value for field causing confusion. Now it correctly inserts the added field into the row the user is currently on instead of at the end.
- Fix another issue related to multiselect where the last line was not cleared properly and requiring the user to click the cancel button before saving/running search.

### 0.34
- Fix an issue introduced in 2025.2 due to NetSuite modifying CSS and not allowing pointer events through.
- Add capability to easily copy field ID (Thanks for the idea - @NewYears1978)
- Stop displaying Standard Field type

### 0.33
- Fix field type for custom column and custom body, which were accidentally reversed. Thanks @tofubear!

### 0.32
- Fix display issue in Redwood theme where line break was causing each option to be much larger
- Fix issue where text search returned results that did not highlight anything due to search being made on prefix of field ID that is not shown to user 

### 0.31
- Add a button for filtering on formulas

### 0.29
- Allow extension to work in Mass Update utility

### 0.28
- Second attempt to fix issues where adding a related field result in an error. The problem was related to adding a related field through the native related tables interface. 

### 0.27
- Correct issue where selecting a related field resulted in an error and unable to save the search.
- Correct issue where related fields were sorted in descending order.

### 0.26
- Migrate codebase to Typescript
- Add unit tests

### 0.25
- Migrating Firefox extension to manifest v3.
- Removing build scripts no longer needed for Firefox.
- Changed initializing call to determine if NS form is already loaded. For some reason, Firefox loads the form quicker than Chrome causing the event handler to be setup after the Form Inited event has already fired.

### 0.24
- Fixed issue that caused a problem with dropdowns in Workflow editor

### 0.23
- Added capability for user to expand related table fields within the same dropdown window
- Added extension popup that allows user to turn on/off extension, enable/disable features, and show/hide certain field attributes.
- Added better error-handling that will automatically revert dropdown back to NetSuite default in the event an error loading Field Finder.
- Automatically resize dropdown window based on field attributes chosen.
- Added Chrome storage permission to store user settings.
- Modified the way that Field Finder is loaded so that it relies on NetSuite API to determine when form is fully loaded.
- Added new icon for extension

### 0.22
- Change autocomplete tag value from false to off.

### 0.21
- Fix bug introduced in version 0.20 related to adding related table fields.

### 0.20
- Added capability for user to add or delete multiple fields to results fields without leaving dropdown
- Added autocomplete=false to search box to prevent autocomplete tools from interacting with field

### 0.19
- Added field filter buttons into button group
- Shortended button field names
- Added CSS to handle option text overflow so long field names do not overlap with field IDs

### 0.18
- Rename Native Fields to Standard Fields to align with NetSuite terminology

### 0.17
- Allow the use of arrow up/down keys to select the next field in the dropdown list
- Allow the use of enter/tab key to select the selected field in the dropdown list
- Prevent the footer from hiding the last option when scrolling field list with mouse

### 0.16
- Create first version with both Firefox and Chrome support

### 0.15
- Add Firefox support
- Add build scripts to easily create separate artifacts for Chrome & Firefox

### 0.14
- Fix issue where fields had incorrect field type of Native rather than Custom if there was not an underscore in scriptID.

### 0.13
- Fix user feedback issue where field finder settings were not cleared when choosing a new field requiring the user to reset the form to start new search.

### 0.12
- Automatically focus on search text box so users can immediately begin searching using Field Finder rather than native browser search.
- Fix bug where dropdown gets reset when user adds field from related table.
- Code cleanup

### 0.11
- Move search text box to left side since it is more commonly used than field type buttons
- Removed checkboxes for field type filters and changed to buttons
- Added footer that indicates number of fields displayed out of total fields

### 0.10
- Fix issue where script ID reverts back to original ID with full prefix after initial load

### 0.9
- Rename Chrome extension to NetSuite Field Finder
- Add capability to be used to select fields in Workflows
- Modified the filtering checkboxes to only display if there is a corresponding field type in the dropdown.
- Remove unneccessary prefixes on native field IDs
- Refactor how the checkbox filters are created so no longer using innerHTML

### 0.8
- Fix issue introduced in 0.7 where hovering over the field filter div in certain areas caused the field list to constantly scroll up.

### 0.7
- Fix issue when using native browser search functionality on dropdown caused the selected option to be hidden behind the field filter form. Now detects when this happens and scrolls div automatically.

### 0.6
- Fix issue where Custom Item and Custom Entity fields were not considered Custom Fields (https://github.com/ericlackey/netsuite-savedsearch-fieldfilter/issues/2)

### 0.5
- Change background color to match native Saved Search background color
- Fix issue where filter wasn't working correctly when editing/creating Transaction searches

### 0.4
- Fix issue causing errors on iFRAME
- Prevent script IDs from going from lowercase to uppercase
- Include blank span for non-transaction searches for consistency and to prevent input search box from moving to left
