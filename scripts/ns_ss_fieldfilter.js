/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

"use strict"

var ffSettings;
var relatedTablesAdded = [];
var ffSearchType = undefined;
var ffRecType = -1;
var enableMultiEditOption = false;
var enableRelatedFieldsExpansion = false;
var enableFieldIdAttribute = false;
var enableFieldNameAttribute = false;
var enableFieldTypeAttribute = false;
var enableDataTypeAttribute = false;
var multiEditOptionReady = false;

// Define field widths for field attributes
const fieldAttributeWidths = {
    DATA_TYPE_WIDTH: 104,
    FIELD_TYPE_WIDTH: 112,
    FIELD_NAME_WIDTH: 280,
    FIELD_ID_WIDTH: 280,
    MULTI_FUNCTION_WIDTH: 24
};

// Define dropdowns name that will be replaced by Field Finder UI
const dropdownsIncluded = [
    "rffield",
    "filterfilter",
    "sort1",
    "sort2",
    "sort3",
    "field",
    "dffield",
    "fffilter"
];

const machinesThatSupportMultiSelect = [
    "returnfields",
    "filterfields",
    "detailfields"
];

// Map of machine name to ID of field that contains field info
const relatedTableDataIds = {
    "filters": "fffilter",
    "returnfields": "rffield",
    "summaryfilters": "filterfilter",
    "detailfields": "dffield",
    "filterfields": "fffilter",
    "field": "field"
};

// Initialize field finder once form is fully loaded by NetSuite
NS.event.once(
    NS.event.type.FORM_INITED,
    initializeFieldFinder
);

function initializeFieldFinder() {

    try {
        ffSettings = JSON.parse(document.getElementById('field-finder-settings').getAttribute('data-options'));
    } catch (err) {
        console.error(`Could not parse Field Finder settings, so not loading. ${err}`);
        return;
    }

    if (!ffSettings?.enabled) {
        return;
    }

    enableMultiEditOption = ffSettings.features.multiSelect;
    enableRelatedFieldsExpansion = ffSettings.features.relatedTableExpansion;
    enableFieldIdAttribute = ffSettings.attributes.fieldId;
    enableFieldNameAttribute = ffSettings.attributes.fieldName;
    enableFieldTypeAttribute = ffSettings.attributes.fieldType;
    enableDataTypeAttribute = ffSettings.attributes.dataType;

    // Do not enable multi-edit option on a popup
    if (enableMultiEditOption)
        enableMultiEditOption = NS.Core.getURLParameter('ifrmcntnr') ? false : true;

    if (enableMultiEditOption) {
        for (const machineName in machines) {
            if (machinesThatSupportMultiSelect.includes(machineName)) {
                let m = machines[machineName];
                if (m.postBuildTableListeners) {
                    m.postBuildTableListeners.push(function() { refreshMutliEditIcons(m); });
                    m.buildtable();
                }
            }
        };
        multiEditOptionReady = true;
    }

    // Store search type and rec type
    ffSearchType = document.getElementById("searchtype")?.value || NS.Core.getURLParameter('searchtype');
    ffRecType = document.getElementById("rectype")?.value  || NS.Core.getURLParameter('rectype') || -1;

    // Prepare dropdowns for Field Filter UI
    if (typeof dropdowns != 'undefined') {
        for (let key in dropdowns) {
            if (dropdownsIncluded.includes(dropdowns[key].name))
                prepareDropdown(dropdowns[key]);
        }
    }

}

// Reset the Field Finder fields back to default when a new option is selected
function resetFieldFinder(dropdown) {
    if (!dropdown.div.id || isFieldFinderDefault(dropdown.fieldFinder))
        return;
    dropdown.fieldFinder.searchInputField.value = '';
    dropdown.fieldFinder.buttons.forEach((button) => {
        button.classList.remove('ff_btn_enabled');
    });
    dropdown.fieldFinder.customFields = false;
    dropdown.fieldFinder.relatedTableFields = false;
    dropdown.fieldFinder.standardFields = false;
    filterDropdowns(dropdown);
}

// Returns true if Field Finder is set to default settings
function isFieldFinderDefault(fieldFinder) {
    if (fieldFinder.searchInputField.value.length > 0) {
        return false;
    }
    const buttonEnabled = (button) => fieldFinder[button.id];
    if (fieldFinder.buttons.some(buttonEnabled)) {
        return false
    };
    return true;
}

// Return a field type based on the field prefix
function getFieldType(fieldId) {
    fieldId = fieldId.toLowerCase();
    let fieldType = 'Standard Field';
    if (fieldId.match(/^(custbody)/)) {
        fieldType = 'Custom Body';
    } else if (fieldId.match(/^(custcol)/)) {
        fieldType = 'Custom Column';
    } else if (fieldId.match(/^(custrecord|custentity|custitem)/)) {
        fieldType = 'Custom Field';
    }
    return fieldType;
}

// Handle keys typed into the search text box
function handleKey(event) {

    event.stopImmediatePropagation();

    if (!currentDropdown) {
        console.error('No active dropdown was found. Ignoring event.');
        return;
    }

    if (event.type == 'keypress')
        return;

    const currentCell = currentDropdown.indexOnDeck || 0;

    // Handle enter & tab key
    if (event.type == 'keyup' && event.key == 'Enter' || event.key == 'Tab') {
        event.preventDefault();
        currentDropdown.setAndClose(currentCell);
        return;
    }
    // Handle arrow keys
    else if (event.type == 'keydown' && (event.key == 'ArrowDown' || event.key == 'ArrowUp')) {
        event.preventDefault();
        if (currentCell == 0 && event.key == 'ArrowUp') {
            return;
        }
        let nextCell = event.key=='ArrowDown' ? currentCell+1 : currentCell-1;
        let nextOption = currentDropdown.divArray[nextCell];
        while(nextOption) {
            if (nextOption && nextOption.style.getPropertyValue('display') == 'block') {
                currentDropdown.respondToArrow(nextCell-currentCell);
                break;
            }
            nextCell = event.key=='ArrowDown' ? nextCell+1 : nextCell-1;
            nextOption = currentDropdown.divArray[nextCell];
        }
    }
    // Handle alpha-numeric keys
    else if (event.type == 'keyup' && (event.keyCode >= 48 && event.keyCode <= 90) || event.keyCode == 8 ) {
        filterDropdowns(currentDropdown);
        // Move selected option back to 0
        currentDropdown.respondToArrow(0-currentDropdown.indexOnDeck);
    }

    // Give focus back to input field
    event.target.focus();

}

// Handle when user clicks on field selector
function handleFieldSelectorClick(event) {
    try {

        if (!currentDropdown) {
            return;
        }

        if (!currentDropdown.fieldFinder) {
            return;
        }

        /*
        * NetSuite resets the dropdown if a related table field is selected
        * so we must prep the dropdown again.
        */
        if (currentDropdown.div.id == '') {
            prepareDropdown(currentDropdown);
        }

        // If there is no field selected, clear the field finder settings
        if (!currentDropdown.getIndex()) {
            resetFieldFinder(currentDropdown);
        }

        // Set focus to the text box if it exists.
        setFocusOnTextBox();

    } catch (err) {
        console.error(`An error occurred while: handling field selector click: ${err}`);
    }
}

// Handles when a user clicks on one of the field type buttons
function handleButtonClick(button) {

    if (!currentDropdown) {
        return;
    }

    const previousValue = currentDropdown.fieldFinder[button.id];

    if (previousValue) {
        button.classList.remove('ff_btn_enabled');
    } else {
        button.classList.add('ff_btn_enabled');
    }

    currentDropdown.fieldFinder[button.id] = previousValue ? false : true;

    // Move selected option back to 0
    currentDropdown.respondToArrow(0-currentDropdown.indexOnDeck);

    setFocusOnTextBox();

    filterDropdowns(currentDropdown);
}

// Add the Field Finder filter elements to the dropdown
function addFieldFinderFilterElements(dropdown) {

    const fieldFilter =  document.createElement('div');
    fieldFilter.classList.add('ff_div');
    fieldFilter.setAttribute('onclick','event.preventDefault();');
    fieldFilter.setAttribute('onpointerdown','event.preventDefault();');

    const searchTextInput = document.createElement('input');
    searchTextInput.classList.add('ff_textbox');
    searchTextInput.setAttribute('placeholder','Filter by Name or ID');
    searchTextInput.setAttribute('type','text');
    searchTextInput.setAttribute('id','ff_show_search_input');
    searchTextInput.setAttribute('onmouseup','event.stopPropagation();this.focus();');
    searchTextInput.setAttribute('onkeyup',`handleKey(event);`);
    searchTextInput.setAttribute('onkeydown',`handleKey(event);`);
    searchTextInput.setAttribute('onkeypress',`handleKey(event);`);
    searchTextInput.setAttribute('ondblclick','event.preventDefault();this.select();');
    searchTextInput.setAttribute('onclick','event.preventDefault();this.select()');
    searchTextInput.setAttribute('autocomplete','off');

    dropdown.fieldFinder.searchInputField = fieldFilter.appendChild(searchTextInput);

    const buttonGroup = document.createElement('div');
    buttonGroup.setAttribute('class','ff_btn_group');
    buttonGroup.setAttribute('id','ff_btn_group');
    buttonGroup.style.setProperty('padding-left','20px');

    dropdown.fieldFinder.buttons = [];
    dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(dropdown, 'standardFields', 'Standard')));

    // Determine what type of fields we have available so we only show filters for those types
    const customFields = dropdown.valueArray.find(el => el.match(/^(custitem|custrecord|custentity|custbody|custcol)/i)) ? true : false;
    const relatedTableFields = dropdown.textArray.find(el => el.match(/\.\.\.$/i)) ? true : false;

    if (customFields)
        dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(dropdown, 'customFields', 'Custom')));

    if (relatedTableFields)
        dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(dropdown, 'relatedTableFields', 'Related')));

    fieldFilter.appendChild(buttonGroup);

    dropdown.fieldFinder.standardFields = false;
    dropdown.fieldFinder.customFields = false;
    dropdown.fieldFinder.relatedTableFields = false;

    dropdown.div.insertBefore(fieldFilter,dropdown.div.childNodes[0]);

}

// Add the Field Finder footer element to the dropdown
function addFieldFinderFooterElement(dropdown) {

    const footerDiv = document.createElement('div');
    footerDiv.setAttribute('id','footerDiv');
    footerDiv.classList.add('ff_div_footer');

    const filterStatusElement = document.createElement('span');
    filterStatusElement.setAttribute('id','ffFilterStatus');
    filterStatusElement.classList.add('ff_status');
    footerDiv.appendChild(filterStatusElement);

    const titleElement = document.createElement('span');
    titleElement.setAttribute('id','ffTitle');
    titleElement.classList.add('ff_title');
    titleElement.textContent = '';
    
    const anchorElement = document.createElement('a');
    anchorElement.href = "https://chrome.google.com/webstore/detail/netsuite-field-finder/npehdolgmmdncpmkoploaeljhkngjbne?hl=en-US&authuser=0";
    anchorElement.title='NetSuite Field Finder 0.23';
    anchorElement.textContent='NetSuite Field Finder 0.23';
    anchorElement.setAttribute('onpointerdown',`event.preventDefault();event.stopImmediatePropagation();window.open('${anchorElement.href}','_blank');`);
    anchorElement.setAttribute('onmousedown','event.preventDefault();event.stopImmediatePropagation();');
    anchorElement.setAttribute('onclick','event.preventDefault();event.stopImmediatePropagation();');

    titleElement.appendChild(anchorElement);
    footerDiv.appendChild(titleElement);

    dropdown.fieldFinder.footer = dropdown.div.appendChild(footerDiv);

}

function prettifyFieldId(fieldId) {
    const regex = new RegExp(`(stdentity|stdbody|custom_|transaction_|${ffSearchType.toLowerCase()}_)`);
    return fieldId.toLowerCase().replace(regex,'');
}

// Prepare Dropdown option
function prepareDropdownOption(dropdown, opt, index) {

    const fieldId = dropdown.valueArray[index];
    const fieldName = dropdown.textArray[index];

    let fieldType = getFieldType(fieldId);

    if (fieldName.endsWith('Fields...')) {
        fieldType = 'Related Fields'
    }

    const newFieldName = fieldName.replace(/\((Custom Body|Custom Column|Custom)\)/i,'');

    opt.setAttribute('ff_fieldtype',fieldType);
    opt.setAttribute('ff_fieldname',newFieldName);
    opt.setAttribute('ff_fieldid',fieldId);
    opt.style.setProperty('display','block');
    opt.textContent='';

    const fieldNameElement = document.createElement('span');
    fieldNameElement.classList.add('ff_option');
    fieldNameElement.style.setProperty('width',`${fieldAttributeWidths.FIELD_NAME_WIDTH}px`);
    fieldNameElement.textContent=newFieldName;

    const fieldIdElement = document.createElement('span');
    fieldIdElement.classList.add('ff_option');
    fieldIdElement.style.setProperty('width',`${fieldAttributeWidths.FIELD_ID_WIDTH}px`);
    fieldIdElement.textContent = fieldType == 'Related Fields' ? '' : prettifyFieldId(opt.getAttribute('ff_fieldid'));
    fieldIdElement.style.visibility = enableFieldIdAttribute ? 'visible': 'hidden';

    const fieldTypeElement = document.createElement('span');
    fieldTypeElement.classList.add('ff_option');
    fieldTypeElement.style.setProperty('width',`${fieldAttributeWidths.FIELD_TYPE_WIDTH}px`);
    fieldTypeElement.textContent=fieldType;
    fieldTypeElement.style.visibility = enableFieldTypeAttribute ? 'visible': 'hidden';;

    const fieldDataTypeElement = document.createElement('span');
    fieldDataTypeElement.classList.add('ff_option');
    fieldDataTypeElement.style.setProperty('width',`${fieldAttributeWidths.DATA_TYPE_WIDTH}px`);
    fieldDataTypeElement.textContent = fieldType == 'Related Fields' ? '' : typeof rfTypes == 'object' ? rfTypes[fieldId] : '';
    fieldDataTypeElement.style.visibility = enableDataTypeAttribute ? 'visible': 'hidden';;

    const multiFunctionElement = document.createElement('span');
    multiFunctionElement.style.setProperty('width',`${fieldAttributeWidths.MULTI_FUNCTION_WIDTH}px`);
    multiFunctionElement.classList.add('ff_option');
    multiFunctionElement.classList.add('ff_quickaction');
    multiFunctionElement.style.setProperty('text-align','center');

    if (enableMultiEditOption
        && dropdown.fieldFinder.multiSelect
        && fieldId != ""
        && fieldType != 'Related Fields') {
        multiFunctionElement.classList.add('ff_multiedit');
        multiFunctionElement.setAttribute('onpointerup',`event.preventDefault();event.stopImmediatePropagation();handleMultiEditClick('${fieldId}');`);
        multiFunctionElement.setAttribute('onmouseup','event.preventDefault();event.stopImmediatePropagation();');
        multiFunctionElement.setAttribute('onclick',"event.preventDefault();event.stopImmediatePropagation();");
    }

    if (enableRelatedFieldsExpansion && fieldType == 'Related Fields') {
        if (relatedTablesAdded.includes(`${dropdown.hddn?.machine?.name}_${fieldId}`))
            multiFunctionElement.classList.add('ff_expandrelated_added');
        else
            multiFunctionElement.classList.add('ff_expandrelated'); 
        multiFunctionElement.setAttribute('onpointerup',`event.preventDefault();event.stopImmediatePropagation();handleRelatedTableClick('${fieldId}');`);
        multiFunctionElement.setAttribute('onmouseup','event.preventDefault();event.stopImmediatePropagation();');
        multiFunctionElement.setAttribute('onclick',"event.preventDefault();event.stopImmediatePropagation();");    
    }

    opt.appendChild(multiFunctionElement);
    opt.appendChild(fieldNameElement);

    if (enableFieldIdAttribute)
        opt.appendChild(fieldIdElement);
    if (enableFieldTypeAttribute)
        opt.appendChild(fieldTypeElement);
    if (enableDataTypeAttribute)
        opt.appendChild(fieldDataTypeElement);

    return true;

}

// Determine the dropdown width based on field attributes selected
function getDropdownWidth() {
    var dropdownWidth = 800;
    if (!enableDataTypeAttribute)
        dropdownWidth = dropdownWidth-fieldAttributeWidths.DATA_TYPE_WIDTH;
    if (!enableFieldTypeAttribute)
        dropdownWidth = dropdownWidth-fieldAttributeWidths.FIELD_TYPE_WIDTH;
    if (!enableFieldIdAttribute)
        dropdownWidth = dropdownWidth-fieldAttributeWidths.FIELD_ID_WIDTH;
    dropdownWidth = (dropdownWidth < 400) ? 400 : dropdownWidth; // Minimum width is 450
    return dropdownWidth;
}

// Prepare the dropdown for use with Field Filter
function prepareDropdown(dropdown) {

    try {

        if (!dropdown.div) {
            dropdown.buildDiv();
        }

        if (!dropdown.fieldFinder) {
            dropdown.fieldFinder = {};
        }

        const dropdownWidth = getDropdownWidth();

        // Increase width of the options element
        dropdown.div.style.setProperty('width',`${dropdownWidth}px`);
        dropdown.div.style.setProperty('margin-bottom','25px');
        dropdown.div.style.setProperty('margin-top','32px');

        // Set the ID of the options element so we can access it later
        dropdown.div.id = `${dropdown.inpt.id}_dropdown`;

        // Set ID of dropdown div so we can access it later
        dropdown.inpt.setAttribute('dropdown',dropdown.div.id);

        // Add event listener to handle when user clicks on field selector
        dropdown.inpt.addEventListener('click',handleFieldSelectorClick);

        // Add event listener to handle when user clicks on field selector arrow
        document.getElementById(`${dropdown.inpt.id}_arrow`)?.addEventListener('click',handleFieldSelectorClick);

        if (machinesThatSupportMultiSelect.includes(dropdown.hddn?.machine?.name)) {
            dropdown.fieldFinder.multiSelect = true;
        }

        // Prepare each option in the dropdown list
        dropdown.div.childNodes.forEach((opt, index) => prepareDropdownOption(dropdown, opt, index));

        // Add the Field Finder filter elements to the dropdown
        addFieldFinderFilterElements(dropdown);

        // Add the Field Finder footer element to the dropdown
        addFieldFinderFooterElement(dropdown);

        if (multiEditOptionReady && dropdown.fieldFinder.multiSelect) {
            refreshMutliEditIcons();
        }

        dropdown.inpt.addEventListener("focus", (event) => {
            setFocusOnTextBox();
        });

    } catch (err) {
        console.warn(`An error occurred while preparing dropdown for NetSuite Field Finder. Restoring dropdown back to NetSuite defaults. The error was: ${err}`);
        dropdown.buildDiv();
        return;
    }

}

// Add a field type button filter
function createFilterButton(dropdown, fieldId, title) {
    const buttonElement = document.createElement('button');
    buttonElement.setAttribute('onpointerdown','event.preventDefault();');
    buttonElement.setAttribute('id',fieldId);
    buttonElement.setAttribute('type','button');
    buttonElement.setAttribute('onclick',`event.stopImmediatePropagation();handleButtonClick(this,${dropdown.inpt.id});`);
    buttonElement.setAttribute('value',0);
    buttonElement.innerText=title;
    return buttonElement;
}

// Automatically set focus on text box so that user can immediately start typing a search string
function setFocusOnTextBox() {
    document.getElementById('ff_show_search_input')?.focus();
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdown) {
    const dropdownDiv = dropdown.div;

    if (!dropdown.div.id) {
        console.warn('Finder was not loaded on this div so abort');
        return;
    }

    const showCustomFields = dropdown.fieldFinder.customFields;
    const showRelatedTableFields = dropdown.fieldFinder.relatedTableFields;
    const showStandardFields = dropdown.fieldFinder.standardFields;
    const searchInputField = dropdown.fieldFinder.searchInputField;

    let fieldsDisplayed = 0;
    let fieldsTotal = 0;
    let filterByFieldType = false;

    if (showCustomFields ||
        showRelatedTableFields ||
        showStandardFields) {
        filterByFieldType = true;
    }

    dropdownDiv.childNodes.forEach((opt, index) => {

        if (index == 0) {
            return true;
        }

        // Filter by field type
        switch(opt.getAttribute('ff_fieldtype')) {
            case 'Related Fields':
                opt.style.setProperty('display',showRelatedTableFields || !filterByFieldType ? 'block' : 'none');
                break;
            case 'Custom Body':
            case 'Custom Column':
            case 'Custom Field':
                opt.style.setProperty('display',showCustomFields || !filterByFieldType ? 'block' : 'none');
                break;
            case 'Standard Field':
                opt.style.setProperty('display',showStandardFields || !filterByFieldType ? 'block' : 'none');
                break;
        };

        if (opt.getAttribute('class') == 'ff_div') {
            return true;
        }

        const searchText = searchInputField.value;

        const searchRegex = new RegExp(searchText, 'gi');

        if (opt.style.getPropertyValue('display') == 'block'
            && opt.getAttribute('ff_fieldname').search(searchRegex)==-1
            && (!enableFieldIdAttribute || opt.getAttribute('ff_fieldid').search(searchRegex)==-1)) {
            opt.style.setProperty('display','none');
        }

        if (opt.style.getPropertyValue('display') != 'none' && opt.getAttribute('ff_fieldname')) {
            if (searchText != '') {
                const newFieldNameHTML = opt.getAttribute('ff_fieldname').replace(searchRegex, '<mark class="highlight">$&</mark>');
                opt.children[1].innerHTML = newFieldNameHTML;
                if (opt.getAttribute('ff_fieldtype') != 'Related Fields') {
                    if (enableFieldIdAttribute) {
                        const newFieldIdHTML = prettifyFieldId(opt.getAttribute('ff_fieldid').toLowerCase()).replace(searchRegex, '<mark class="highlight">$&</mark>');
                        opt.children[2].innerHTML = newFieldIdHTML;
                    }
                }
            } else {
                opt.children[1].innerHTML = opt.getAttribute('ff_fieldname');
                if (opt.getAttribute('ff_fieldtype') != 'Related Fields') {
                    if (enableFieldIdAttribute)
                        opt.children[2].innerHTML = prettifyFieldId(opt.getAttribute('ff_fieldid').toLowerCase());
                }
            }
        }

        if (opt.getAttribute('id') != 'footerDiv') {
            if (opt.style.getPropertyValue('display') == 'block') {
                fieldsDisplayed++;
            }
            fieldsTotal++;
        }

        return true;
    });

    // Display footer text with number of fields being shown
    const footerDiv = dropdown.fieldFinder.footer;
    const ffFilterStatus = footerDiv.childNodes[0];
    ffFilterStatus.textContent=`Showing ${fieldsDisplayed} of ${fieldsTotal} fields.`;
}

// Refresh multi-field edit icons on dropdown to reflect current search fields
function refreshMutliEditIcons(machine) {

    // First, reset all multiedit icons back to default
    const dropdown = machine?.layoutdd;

    if (!dropdown?.div)
        return;

    if (!dropdown.fieldFinder)
        return;

    const selectedFieldsArray = machine.dataManager.getLineArray().map((x)=>{return x[0];});

    // Find all fields currently selected
    const collection = dropdown.div.getElementsByClassName("ff_multiedit_selected");

    // Reset any selected fields back to default to account for any deleted
    Array.from(collection).forEach(function (element) {
        element.classList.remove('ff_multiedit_selected');
    });

    // Now enable selected fields based on current line array
    for (let sf of selectedFieldsArray) {        
        const dropdownIndex = dropdown.valueToIndexMap[sf];
        const dropdownOption = dropdown.divArray[dropdownIndex];
        if (dropdownOption) {
            dropdownOption.childNodes[0].classList.add('ff_multiedit_selected');
        }
    }

}

// Allows user to add/remove multiple fields without leaving dropdown
function handleMultiEditClick(fieldId) {

    if (!multiEditOptionReady) {
        console.warn('Multi edit option was not ready. Ignorning click.');
        return;
    }

    try {

        const machine = currentDropdown.hddn?.machine;

        if (!machine) {
            console.warn(`Could not find machine ${machine} so ignoring click`);
        }

        const fieldToSearch = {
            "detailfields": "dffield",
            "returnfields": "rffield",
            "filterfields": "field"
        };

        // Determine if field has already been added to return lines.
        const indexOfField = machine.dataManager.findFieldValueLineNum(fieldToSearch[machine.name],fieldId);

        // If it has not, add it. Otherwise, delete it.
        if (indexOfField == -1) {
            machine.insertLine([fieldId,'','','','','',''],machine.getLineCount()+1);
            machine.incrementIndex();
            machine.setMachineIndex(machine.getLineCount()+1);
        }
        else {
            machine.deleteline(indexOfField, true);
            machine.setMachineIndex(machine.getLineCount()+1); // Set focus on last line
            machine.clearline(); // Set focus on last line
        }

        machine.buildtable(); // Rebuild the results table
    }
    catch (err) {
        console.error(`An error occured while perfoming multi edit action: ${err}`);
    }

}

// Craft the URL needed to retrieve related table fields
function getRelatedTableUrl(tableId) {
    let url = "";
    const machineName = currentDropdown.hddn?.machine?.name || currentDropdown.name;
    switch  (machineName) {
        case "filters":
            url = `/app/common/search/search.nl?join=${tableId}&searchtype=${ffSearchType}&ifrmcntnr=T&rectype=${ffRecType}`;
            break;
        case "returnfields":
            url = `/app/common/search/search.nl?resultjoin=${tableId}&sel=${currentDropdown.name}&mach=returnfields&searchtype=${ffSearchType}&ifrmcntnr=T&rectype=${ffRecType}`;
            break;
        case "summaryfilters":
            url = `/app/common/search/search.nl?resultjoin=${tableId}&sel=filterfilter&mach=summaryfilters&searchtype=${ffSearchType}&ifrmcntnr=T&rectype=${ffRecType}`;
            break;
        case "field":
            url = `/app/common/search/search.nl?formulajoin=${tableId}&filterformula=T&field=formula&useids=F&searchtype=${ffSearchType}&ifrmcntnr=T&rectype=${ffRecType}`;
            break;
        case "detailfields":
            url = `/app/common/search/search.nl?resultjoin=${tableId}&sel=dffield&mach=detailfields&searchtype=${ffSearchType}&ifrmcntnr=T&rectype=${ffRecType}`;
            break;
        case "filterfields":
            url = `/app/common/search/search.nl?ffjoin=${tableId}&searchtype=${ffSearchType}&rectype=${ffRecType}&ifrmcntnr=T`;

    }
    return url;
}

// Expands related table so that all fields are available in same
async function handleRelatedTableClick(tableId) {

    const machineName = currentDropdown.hddn?.machine?.name || currentDropdown.name;
    var dataFields, joinLabel;

    if (relatedTablesAdded.includes(`${machineName}_${tableId}`)) {
        return; // Ignore if we have already added this table
    }

    const relatedTableUrl = getRelatedTableUrl(tableId.replace(/^\_/,'')); // Craft the URL to call for related fields

    const selectedIndex = currentDropdown.getIndexForValue(tableId); // Get index where user clicked

    if (!relatedTableUrl) {
        console.error("No related field URL was available. Ignoring click.");
        return;
    }

    // Retrieve the related field table
    try {

        const httpResponse = await fetch(relatedTableUrl);

        if (httpResponse.status != 200)
            throw new Error('HTTP error while retrieving related fields.');

        const htmlText = await httpResponse.text();

        // Parse returned HTML
        const parsedHTMLDoc = new DOMParser().parseFromString(htmlText, "text/html");

        // Grab related field data
        dataFields = JSON.parse(parsedHTMLDoc.querySelector(`div[data-name='${relatedTableDataIds[machineName]}']`).getAttribute("data-options"));

        // Grab the join label
        joinLabel = parsedHTMLDoc.querySelector("input[id='joinlabel']").value;

    } catch (err) {
        console.warn(`Ignoring request to expand related table due to error ${err}.`);
        return;
    }

    // Close the current dropdown
    currentDropdown.close();

    // Add all of the related fields to the current active dropdown
    for (let field of dataFields) {
        if (field.value == '')
            continue;
        const x = currentDropdown.addOption(`${joinLabel} : ${field.text}`,field.value,selectedIndex+1);
        try {
            setRfType(field.value,'');
        } catch(err) {}
    }

    relatedTablesAdded.push(`${machineName}_${tableId}`);
    currentDropdown.buildDiv(); // Rebuild the DIV now that we have added new fields
    prepareDropdown(currentDropdown); // Prepare the dropdown again with Field Finder formatting
    currentDropdown.open(); // Open the dropdown back up
    currentDropdown.setCurrentCellInMenu(currentDropdown.divArray[selectedIndex]); // Jump to the first option of added fields
    currentDropdown.currentCell.scrollIntoView(true);

}
