/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

import { dropdownsIncluded, machinesThatSupportMultiSelect } from "./constants";
import { FieldFinderDropdown, handleFieldUpdate } from "./dropdown";

// NetSuite modules that will be available at runtime
declare var NS:any;
declare var machines:any;
declare var dropdowns:any;

// TODO: Add this back after release of 0.26
//let acorn = require("acorn");

// FieldFinder variables
var ffSettings: FieldFinderSettings;
var ffSearchType: string;
var ffRecType = -1;

// Initialize field finder once form is fully loaded by NetSuite
if (typeof NS != 'undefined') {
    if (NS.form.isInited())
        initializeFieldFinder();
    else
        NS.event.once(
            NS.event.type.FORM_INITED,
            initializeFieldFinder
        );
}

export function initializeFieldFinder() {

    try {
        const settingsElement = document.getElementById('field-finder-settings') as HTMLInputElement;
        ffSettings = JSON.parse(settingsElement.getAttribute('data-options') || '') as FieldFinderSettings;
    } catch (err) {
        console.error(`Could not parse Field Finder settings, so not loading. ${err}`);
        return;
    }

    if (ffSettings.enabled == false)
        return;

    // Do not enable multi-edit option on a popup
    if (ffSettings.features.multiSelect)
        ffSettings.features.multiSelect = NS.Core.getURLParameter('ifrmcntnr') ? false : true;

    if (ffSettings.features.multiSelect) {
        for (const machineName in machines) {
            if (machinesThatSupportMultiSelect.includes(machineName)) {
                let m = machines[machineName];
                if (m.postBuildTableListeners) {
                    m.postBuildTableListeners.push(function() { handleFieldUpdate(m); });
                    m.buildtable();
                }
            }
        };
    }

    // Store search type and rec type
    ffSearchType = (document.getElementById("searchtype") as HTMLInputElement)?.value || NS.Core.getURLParameter('searchtype');
    ffRecType = (document.getElementById("rectype") as HTMLInputElement)?.value  || NS.Core.getURLParameter('rectype') || -1;

    if (typeof dropdowns != undefined) {
        for (let key in dropdowns) {
            if (dropdownsIncluded.includes(dropdowns[key].name))
                dropdowns[key].fieldFinder = new FieldFinderDropdown(dropdowns[key], ffSearchType, ffRecType, ffSettings);
        }
    }

}