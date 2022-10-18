/*
*
* This script handles injecting code into the site and handling
* saving settings into Chrome storage
*
*/

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Wait for fieldFilter element to be added to main page and then load settings and add event handlers to save settings
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.addedNodes.length >0 && mutation.addedNodes[0].id === 'fieldFilter') {
        loadSettingsFromStorage();
        addEventHandlers();
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(document, config);

// Inject code into the main page
var s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/ns_ss_fieldfilter.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// On load, load the cached values from Chrome storage
function loadSettingsFromStorage() {
    chrome.storage.sync.get([
        'ff_show_custom_body_fields',
        'ff_show_custom_column_fields',
        'ff_show_related_table_fields',
        'ff_show_native_fields',
        'ff_show_search_input'
        ], function(data) {
        document.getElementById('ff_show_custom_body_fields').checked = data.ff_show_custom_body_fields;
        document.getElementById('ff_show_custom_column_fields').checked = data.ff_show_custom_column_fields;
        document.getElementById('ff_show_related_table_fields').checked = data.ff_show_related_table_fields;
        document.getElementById('ff_show_native_fields').checked = data.ff_show_native_fields;
        document.getElementById('ff_show_search_input').value = data.ff_show_search_input;
    });
}

// Find all of the Field Field field elements and add a change listener on them
function addEventHandlers() {
    document.querySelectorAll("[id^='ff_show_']").forEach((el) => {
        el.addEventListener('change', handleFieldFilterChange);
    });
}

// Save any settings changes to Chrome storage
function handleFieldFilterChange(event) {
    const element = event.target;
    let syncObject = {}
    syncObject[element.id] = element.getAttribute('type') == 'checkbox' ? element.checked : element.value;
    chrome.storage.sync.set(syncObject);
}

// Listen for Chrome Storage changes so we can update the Field Filter fields if they were changed in iFRAME
chrome.runtime.onMessage.addListener((changes) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        let el = document.getElementById(key);
        let elementType = el.getAttribute("type");
        if (elementType == "checkbox" && el.checked != newValue) {
            el.checked = newValue;
        }
        else if (elementType == "text" && el.value != newValue) {
            el.value = newValue;
        }
        // We must dispatch an event ourselves so main page knows something changed
        var event = new Event('change');
        el.dispatchEvent(event);
    }
    return true
});
