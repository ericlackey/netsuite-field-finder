const enableFieldFinder = document.getElementById('enableFieldFinder') as HTMLInputElement;
const enableMultiSelect = document.getElementById('featureMultiSelect') as HTMLInputElement;
const enableRelatedTableExpansion = document.getElementById('featureRelatedTableExpansion') as HTMLInputElement;
const enableFieldId = document.getElementById('attributeFieldId') as HTMLInputElement;
const enableFieldType = document.getElementById('attributeFieldType') as HTMLInputElement;
const enableDataType = document.getElementById('attributeDataType') as HTMLInputElement;
const messageToast = document.getElementById('myToast') as HTMLElement;

// Update settings in Chrome storage
function updateSettings() {
    const settings = {
        enabled: enableFieldFinder.checked,
        features: {
            multiSelect: enableMultiSelect.checked,
            relatedTableExpansion: enableRelatedTableExpansion.checked
        },
        attributes: {
            fieldId: enableFieldId.checked,
            fieldType: enableFieldType.checked,
            dataType: enableDataType.checked
        }
    }
    chrome.storage.local.set({ settings: settings }).then(() => {
        toggleForm(settings);
    });
    const aToast = new bootstrap.Toast(messageToast);
    aToast.show();
}

// Enable or disable form based on current settings
function toggleForm(settings: FieldFinderSettings) {
    const fsFeatures = document.getElementById('fsFeatures') as HTMLElement;
    const fsAttributes = document.getElementById('fsAttributes') as HTMLElement;
    if (settings.enabled) {
        fsFeatures.removeAttribute('disabled');
        fsAttributes.removeAttribute('disabled');
    } else {
        fsFeatures.setAttribute('disabled','');
        fsAttributes.setAttribute('disabled','');
    }
}

// Update settings in storage whenever a click event ocurrs
const inputSettings = document.getElementById('settings') as HTMLFormElement;
inputSettings.addEventListener('change',updateSettings);

// Get field finder settings and apply to form
chrome.storage.local.get(['settings']).then((storage) => {
    const settings = storage.settings as FieldFinderSettings;
    enableFieldFinder.checked = settings.enabled;
    enableMultiSelect.checked = settings.features.multiSelect;
    enableRelatedTableExpansion.checked = settings.features.relatedTableExpansion;
    enableFieldId.checked = settings.attributes.fieldId;
    enableFieldType.checked = settings.attributes.fieldType;
    enableDataType.checked = settings.attributes.dataType;
    toggleForm(settings);
});
