/*
*
* This script handles injecting code into the site
*
*/

// Inject script into the main page
var s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/ns_ss_fieldfilter.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Define default settings if not found in storage
const defaultSettings = {
    enabled: true,
    features: {
        multiSelect: true,
        relatedTableExpansion: true
    },
    attributes: {
        fieldId: true,
        fieldType: true,
        dataType: true
    }
}

// Attempt to load settings from local storage. If not found, set to defaults.
chrome.storage.local.get(['settings']).then((storage) => {
    var settings = storage.settings;
    if (!settings) {
        settings = defaultSettings
        chrome.storage.local.set({ settings: settings });
    }
    var ffSettingsElement = document.createElement('input');
    ffSettingsElement.id = "field-finder-settings";
    ffSettingsElement.setAttribute("data-options",JSON.stringify(settings));
     // Inject settings into DOM so that field finder script knows how to configure settings
    (document.head || document.documentElement).appendChild(ffSettingsElement);
});