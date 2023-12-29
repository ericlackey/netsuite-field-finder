'use strict';

// Update settings in Chrome storage
function updateSettings(event) {
    const settings = {
        enabled: document.getElementById('enableFieldFinder').checked,
        features: {
            multiSelect: document.getElementById('featureMultiSelect').checked,
            relatedTableExpansion: document.getElementById('featureRelatedTableExpansion').checked
        },
        attributes: {
            fieldId: document.getElementById('attributeFieldId').checked,
            fieldType: document.getElementById('attributeFieldType').checked,
            dataType: document.getElementById('attributeDataType').checked
        }
    }
    chrome.storage.local.set({ settings: settings }).then(() => {
        toggleForm(settings);
    });
    const aToast = new bootstrap.Toast(document.getElementById('myToast'));
    aToast.show();
}

// Enable or disable form based on current settings
function toggleForm(settings) {
    if (settings.enabled) {
        document.getElementById('fsFeatures').removeAttribute('disabled');
        document.getElementById('fsAttributes').removeAttribute('disabled');    
    } else {
        document.getElementById('fsFeatures').setAttribute('disabled',null);
        document.getElementById('fsAttributes').setAttribute('disabled',null);    
    }
}

// Update settings in storage whenever a click event ocurrs
document.getElementById('settings').addEventListener('change',updateSettings);

// Get field finder settings and apply to form
chrome.storage.local.get(['settings']).then((storage) => {
    const settings = storage.settings;
    document.getElementById('enableFieldFinder').checked = settings.enabled;
    document.getElementById('featureMultiSelect').checked = settings.features.multiSelect;
    document.getElementById('featureRelatedTableExpansion').checked = settings.features.relatedTableExpansion;
    document.getElementById('attributeFieldId').checked = settings.attributes.fieldId;
    document.getElementById('attributeFieldType').checked = settings.attributes.fieldType;
    document.getElementById('attributeDataType').checked = settings.attributes.dataType;
    toggleForm(settings);
});
