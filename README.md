# netsuite-savedsearch-fieldfilter
NetSuite Saved Search Field Filter

## Summary

A Chrome extension for NetSuite Saved Search that allows users to filter the list of fields to specific types or search for a field name or field ID. It also improves the field dropdown listing to provide more details about the field.

## Release Notes

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
