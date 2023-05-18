# netsuite-field-finder
NetSuite Field Finder

## Summary

A Chrome & Firefox browser extension for NetSuite that allows users to quicky find fields in Saved Searches and Workflows by filtering the list of fields to specific types or search for a field name or field ID. It also improves the field dropdown listing to provide more details about the field.

## Release Notes

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
