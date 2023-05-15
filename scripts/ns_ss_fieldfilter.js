/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

"use strict"

// Define the NetSuite field dropdowns where we want to add filtering capability
const fieldsToFilter = [
    "input[id^='inpt_filterfilter']",
    "input[id^='inpt_field']",
    "input[id^='inpt_rffield']",
    "input[id^='inpt_fffilter']",
    "input[id^='inpt_sort']",
    "input[id^='inpt_valuefield']",
    "input[id^='inpt_filterfield']"
];

// Prepare the dropdowns for Field Filter
document.querySelectorAll(fieldsToFilter.join(',')).forEach((fieldSelector) => {
    prepareDropdown(fieldSelector);
    return true;
});

// Reset the Field Finder fields back to default when a new option is selected
function resetFieldFinder(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
    if (isFieldFinderDefault(dropdown.fieldFinder)) {
        return;
    }
    dropdown.fieldFinder.searchInputField.value = '';
    dropdown.fieldFinder.buttons.forEach((button) => {
        button.classList.remove('ff_button_enabled');
    });
    dropdown.fieldFinder.customBodyFields = false;
    dropdown.fieldFinder.customColumnFields = false;
    dropdown.fieldFinder.customFields = false;
    dropdown.fieldFinder.relatedTableFields = false;
    dropdown.fieldFinder.nativeFields = false;
    filterDropdowns(fieldSelector);
}

// Returns true if Field Finder is set to default settings
function isFieldFinderDefault(fieldFinder) {
    if (fieldFinder.searchInputField.value != '') {
        return false;
    }
    const buttonEnabled = (button) => fieldFinder[button.id];
    if (!fieldFinder.buttons.some(buttonEnabled)) {
        return false
    };
    return true;
}

// Return a field type based on the field prefix
function getFieldType(fieldId) {
    fieldId = fieldId.toLowerCase();
    let fieldType = 'Native Field';
    if (fieldId.match(/^(custbody)/)) {
        fieldType = 'Custom Body';
    } else if (fieldId.match(/^(custcol)/)) {
        fieldType = 'Custom Column';
    } else if (fieldId.match(/^(custrecord|custentity|custitem)/)) {
        fieldType = 'Custom Field';
    }
    return fieldType;
}

// Handle enter, tab, arrow up/down keys
function handleKeyDown(event, fieldSelector) {
    event.stopImmediatePropagation();

    const dropdown = getDropdown(fieldSelector);
    const currentCell = dropdown.indexOnDeck || 0;

    if (event.key == 'Enter' || event.key == 'Tab') {
        event.preventDefault();
        dropdown.setAndClose(currentCell);
        return;
    }

    // If there is already an option selected
    if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
        event.preventDefault();
        if (currentCell == 0 && event.key == 'ArrowUp') {
            return;
        }
        let nextCell = event.key=='ArrowDown' ? currentCell+1 : currentCell-1;
        let nextOption = dropdown.divArray[nextCell];
        while(nextOption) {
            if (nextOption && nextOption.style.display == 'block') {
                dropdown.respondToArrow(nextCell-currentCell);
                break;
            }
            nextCell = event.key=='ArrowDown' ? nextCell+1 : nextCell-1;
            nextOption = dropdown.divArray[nextCell];
        }
    }

    scrollDown(dropdown);

    // Give focus back to input field
    event.target.focus();
}

// Handle alpha-numeric keys typed into textbox
function handleKeyUp(event, fieldSelector) {
    event.stopImmediatePropagation();
    if ((event.keyCode >= 48 && event.keyCode <= 90) || event.keyCode == 8 ) {
        filterDropdowns(fieldSelector);
        const dropdown = getDropdown(fieldSelector);
        // Move selected option back to 0
        dropdown.respondToArrow(0-dropdown.indexOnDeck);
        // Give textbox the focus back since the method above steals it
        event.target.focus();
    }
}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleFieldSelectorClick(event) {
    try {

        const target = document.getElementById(event.target.id.replace(/\_arrow$/,''));
        const dropdown = getDropdown(target);

        if (!dropdown.getIndex()) {
            resetFieldFinder(target);
        }

        /*
        * NetSuite resets the dropdown if a related table field is selected
        * so we must prep the dropdown again.
        */
        if (dropdown.div.id == '') {
            prepareDropdown(target);
        }

        scrollDown(dropdown);

    } catch (err) {
        console.error(`An error occurred while: handling field selector click: ${err}`);
    }

    // Set focus to the text box if it exists.
    setFocusOnTextBox();
}

// Handles when a user clicks on one of the field type buttons
function handleButtonClick(button, fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
    const previousValue = dropdown.fieldFinder[button.id];

    if (previousValue) {
        button.classList.remove('ff_button_enabled');
    } else {
        button.classList.add('ff_button_enabled');
    }

    dropdown.fieldFinder[button.id] = previousValue ? false : true;

    // Move selected option back to 0
    dropdown.respondToArrow(0-dropdown.indexOnDeck);

    setFocusOnTextBox();

    filterDropdowns(fieldSelector);
}

// Prevents first option from being hidden behind Field Finder div
function scrollDown(dropdown) {
    if (dropdown?.currentCell) {
        const dropdownLocation = dropdown.div.getBoundingClientRect();
        const selectedOptionLocation = dropdown.currentCell.getBoundingClientRect();
        const diff = (selectedOptionLocation.top - dropdownLocation.top);
        if (diff < 32) {
            dropdown.div.scrollBy({
                top: -32+diff,
                behavior: 'instant'
            });
        }
    }
}

// Add the Field Finder filter elements to the dropdown
function addFieldFinderFilterElements(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
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
    searchTextInput.setAttribute('onkeyup',`handleKeyUp(event,${fieldSelector.id});`);
    searchTextInput.setAttribute('onkeydown',`handleKeyDown(event,${fieldSelector.id});`);
    searchTextInput.setAttribute('onkeypress','event.stopImmediatePropagation();');
    searchTextInput.setAttribute('ondblclick','event.preventDefault();this.select();');
    searchTextInput.setAttribute('onclick','event.preventDefault();this.select()');

    dropdown.fieldFinder = {};
    dropdown.fieldFinder.searchInputField = fieldFilter.appendChild(searchTextInput);

    dropdown.fieldFinder.buttons = [];
    dropdown.fieldFinder.buttons.push(fieldFilter.appendChild(createFilterButton(fieldSelector, 'nativeFields', 'Native Fields')));

    // Determine what type of fields we have available so we only show filters for those types
    const customBodyFields = dropdown.valueArray.find(el => el.match(/^(custbody)/i)) ? true : false;
    const customColumnFields = dropdown.valueArray.find(el => el.match(/^(custcol)/i)) ? true : false;
    const customFields = dropdown.valueArray.find(el => el.match(/^(custitem|custrecord|custentity)/i)) ? true : false;
    const relatedTableFields = dropdown.textArray.find(el => el.match(/\.\.\.$/i)) ? true : false;

    if (customBodyFields) {
        dropdown.fieldFinder.buttons.push(fieldFilter.appendChild(createFilterButton(fieldSelector, 'customBodyFields', 'Custom Body Fields')));
    }

    if (customColumnFields) {
        dropdown.fieldFinder.buttons.push(fieldFilter.appendChild(createFilterButton(fieldSelector, 'customColumnFields', 'Custom Column Fields')));
    }

    if (customFields) {
        dropdown.fieldFinder.buttons.push(fieldFilter.appendChild(createFilterButton(fieldSelector, 'customFields', 'Custom Fields')));
    }

    if (relatedTableFields) {
        dropdown.fieldFinder.buttons.push(fieldFilter.appendChild(createFilterButton(fieldSelector, 'relatedTableFields', 'Related Table Fields')));
    }

    dropdown.fieldFinder.nativeFields = false;
    dropdown.fieldFinder.customBodyFields = false;
    dropdown.fieldFinder.customColumnFields = false;
    dropdown.fieldFinder.customFields = false;
    dropdown.fieldFinder.relatedTableFields = false;

    dropdown.div.insertBefore(fieldFilter,dropdown.div.childNodes[0]);
}

// Add the Field Finder footer element to the dropdown
function addFieldFinderFooterElement(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
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
    titleElement.textContent = 'Filtered by ';
    
    const anchorElement = document.createElement('a');
    anchorElement.href = "https://chrome.google.com/webstore/detail/netsuite-field-finder/npehdolgmmdncpmkoploaeljhkngjbne?hl=en-US&authuser=0";
    anchorElement.title='Filtered by NetSuite Field Finder 0.17';
    anchorElement.textContent='NetSuite Field Finder 0.17';
    anchorElement.setAttribute('onpointerdown',`event.preventDefault();event.stopImmediatePropagation();window.open('${anchorElement.href}','_blank');`);
    anchorElement.setAttribute('onmousedown','event.preventDefault();event.stopImmediatePropagation();');
    anchorElement.setAttribute('onclick','event.preventDefault();event.stopImmediatePropagation();');

    titleElement.appendChild(anchorElement);
    footerDiv.appendChild(titleElement);

    dropdown.fieldFinder.footer = dropdown.div.appendChild(footerDiv);
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
    opt.setAttribute('ff_fieldid',fieldId.toLowerCase().replace(/^(stdentity|stdbody|custom_|transaction_)/,''));
    opt.setAttribute('style','display:block');
    opt.textContent='';

    const fieldNameElement = document.createElement('span');
    fieldNameElement.classList.add('ff_option');
    fieldNameElement.style.cssText = 'width:35%;';
    fieldNameElement.textContent=newFieldName;

    const fieldIdElement = document.createElement('span');
    fieldIdElement.classList.add('ff_option');
    fieldIdElement.style.cssText = 'width:35%;';
    fieldIdElement.textContent = fieldType == 'Related Fields' ? '' : opt.getAttribute('ff_fieldid');

    const fieldTypeElement = document.createElement('span');
    fieldTypeElement.classList.add('ff_option');
    fieldTypeElement.style.cssText = 'width:15%;';
    fieldTypeElement.textContent=fieldType;

    const fieldDataTypeElement = document.createElement('span');
    fieldDataTypeElement.classList.add('ff_option');
    fieldDataTypeElement.style.cssText = 'width:15%;';
    fieldDataTypeElement.textContent = fieldType == 'Related Fields' ? '' : typeof rfTypes == 'object' ? rfTypes[fieldId] : '';

    opt.appendChild(fieldNameElement);
    opt.appendChild(fieldIdElement);
    opt.appendChild(fieldTypeElement);
    opt.appendChild(fieldDataTypeElement);

    return true;
}

// Prepare the dropdown for use with Field Filter
function prepareDropdown(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);

    if (!dropdown.div) {
        dropdown.buildDiv();
    }

    // Increase width of the options element
    dropdown.div.style.width='800px';

    // Set the ID of the options element so we can access it later
    dropdown.div.id = `${fieldSelector.id}_dropdown`;

    // Set ID of dropdown div so we can access it later
    fieldSelector.setAttribute('dropdown',dropdown.div.id);

    // Add event listener to handle when user clicks on field selector
    fieldSelector.addEventListener('click',handleFieldSelectorClick);

    // Add event listener to handle when user clicks on field selector arrow
    document.getElementById(`${fieldSelector.id}_arrow`)?.addEventListener('click',handleFieldSelectorClick);

    // Prepare each option in the dropdown list
    dropdown.div.childNodes.forEach((opt, index) => prepareDropdownOption(dropdown, opt, index));

    // Add the Field Finder filter elements to the dropdown
    addFieldFinderFilterElements(fieldSelector);

    // Add the Field Finder footer element to the dropdown
    addFieldFinderFooterElement(fieldSelector);
}

// Add a field type button filter
function createFilterButton(fieldSelector, fieldId, title) {
    const buttonElement = document.createElement('button');
    buttonElement.classList.add('ff_button');
    buttonElement.setAttribute('onpointerdown','event.preventDefault();');
    buttonElement.setAttribute('id',fieldId);
    buttonElement.setAttribute('type','button');
    buttonElement.setAttribute('onclick',`event.stopImmediatePropagation();handleButtonClick(this,${fieldSelector.id});`);
    buttonElement.setAttribute('value',0);
    buttonElement.innerText=title;
    return buttonElement;
}

// Automatically set focus on text box so that user can immediately start typing a search string
function setFocusOnTextBox() {
    document.getElementById('ff_show_search_input')?.focus();
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (fieldSelector) {

    const dropdown = getDropdown(fieldSelector);
    const dropdownDiv = dropdown.div;

    const showCustomBodyFields = dropdown.fieldFinder.customBodyFields;
    const showCustomColumnFields = dropdown.fieldFinder.customColumnFields;
    const showCustomFields = dropdown.fieldFinder.customFields;
    const showRelatedTableFields = dropdown.fieldFinder.relatedTableFields;
    const showNativeFields = dropdown.fieldFinder.nativeFields;
    const searchInputField = dropdown.fieldFinder.searchInputField;

    let fieldsDisplayed = 0;
    let fieldsTotal = 0;
    let filterByFieldType = false;

    if (showCustomBodyFields ||
        showCustomColumnFields ||
        showCustomFields ||
        showRelatedTableFields ||
        showNativeFields) {
        filterByFieldType = true;
    }

    dropdownDiv.childNodes.forEach((opt, index) => {

        if (index == 0) {
            return true;
        }

        // Filter by field type
        switch(opt.getAttribute('ff_fieldtype')) {
            case 'Related Fields':
                opt.style.display = showRelatedTableFields || !filterByFieldType ? 'block' : 'none';
                break;
            case 'Custom Body':
                opt.style.display = showCustomBodyFields || !filterByFieldType ? 'block' : 'none';
                break;
            case 'Custom Column':
                opt.style.display = showCustomColumnFields || !filterByFieldType ? 'block' : 'none';
                break;
            case 'Custom Field':
                opt.style.display = showCustomFields || !filterByFieldType ? 'block' : 'none';
                break;
            case 'Native Field':
                opt.style.display = showNativeFields || !filterByFieldType ? 'block' : 'none';
                break;
        };

        if (opt.getAttribute('class') == 'ff_div') {
            return true;
        }

        const searchText = searchInputField.value;

        const searchRegex = new RegExp(searchText, 'gi');

        if (opt.style.display == 'block'
            && opt.getAttribute('ff_fieldname').search(searchRegex)==-1
            && opt.getAttribute('ff_fieldid').search(searchRegex)==-1) {
            opt.style.display = 'none';
        }

        if (opt.style.display != 'none' && opt.getAttribute('ff_fieldname')) {
            if (searchText != '') {
                const newFieldNameHTML = opt.getAttribute('ff_fieldname').replace(searchRegex, '<mark class="highlight">$&</mark>');
                opt.children[0].innerHTML = newFieldNameHTML;
                if (opt.getAttribute('ff_fieldtype') != 'Related Fields') {
                    const newFieldIdHTML = opt.getAttribute('ff_fieldid').toLowerCase().replace(searchRegex, '<mark class="highlight">$&</mark>');
                    opt.children[1].innerHTML = newFieldIdHTML;
                }
            } else {
                opt.children[0].innerHTML = opt.getAttribute('ff_fieldname');
                if (opt.getAttribute('ff_fieldtype') != 'Related Fields') {
                    opt.children[1].innerHTML = opt.getAttribute('ff_fieldid').toLowerCase();
                }
            }
        }

        if (opt.getAttribute('id') != 'footerDiv') {
            if (opt.style.display == 'block') {
                fieldsDisplayed++;
            }
            fieldsTotal++;
        }

        return true;
    });

    // Display footer text with number of fields being shown
    const footerDiv = dropdown.fieldFinder.footer;
    const ffFilterStatus = footerDiv.childNodes[0];
    if (fieldsTotal > fieldsDisplayed) {
        ffFilterStatus.textContent=`Showing ${fieldsDisplayed} of ${fieldsTotal} fields.`;
        footerDiv.style.visibility = 'visible';
    } else {
        footerDiv.style.visibility = 'hidden';
    }

    return true;

}
