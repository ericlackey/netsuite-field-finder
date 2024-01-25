/*
*
* This script handles injecting code into the site
*
*/

// Define default settings if not found in storage
const defaultSettings: FieldFinderSettings = {
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
    var settings = storage.settings as FieldFinderSettings;
    if (!settings) {
        settings = defaultSettings
        chrome.storage.local.set({ settings: settings as FieldFinderSettings });
    }
    var ffSettingsElement = document.createElement('input') as HTMLInputElement;
    ffSettingsElement.id = "field-finder-settings";
    ffSettingsElement.setAttribute("data-options",JSON.stringify(settings));
     // Inject settings into DOM so that field finder script knows how to configure settings
    (document.head || document.documentElement).appendChild(ffSettingsElement);
});

// Inject script into the main page
var s = document.createElement('script') as HTMLScriptElement;
s.src = chrome.runtime.getURL('fieldfinder.js');
(document.head || document.documentElement).appendChild(s);