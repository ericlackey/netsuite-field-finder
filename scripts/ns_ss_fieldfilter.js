/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

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
document.querySelectorAll(fieldsToFilter.join(',')).forEach((el) => prepareDropdown(el));

// Return a field type based on the field prefix
function getFieldType(fieldIdPrefix) {
    let fieldType;
    switch(fieldIdPrefix) {
        case "custbody":
            fieldType = 'Custom Body';
            break;
        case "custcol":
            fieldType = 'Custom Column';
            break;
        case "custrecord":
        case "custentity":
        case "custitem":
            fieldType = 'Custom Field';
            break;
        default:
            fieldType = 'Native Field';
            break;
    }
    return fieldType;
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
    searchTextInput.setAttribute('onkeydown','event.stopImmediatePropagation();');
    searchTextInput.setAttribute('onkeypress','event.stopImmediatePropagation();');
    searchTextInput.setAttribute('onkeyup',`event.stopImmediatePropagation();filterDropdowns(${dropdown.div.id});`);
    searchTextInput.setAttribute('ondblclick','event.preventDefault();this.select();');
    searchTextInput.setAttribute('onclick','event.preventDefault();this.select()');

    const searchTextElement = document.createElement('span');
    searchTextElement.setAttribute('onclick','event.preventDefault();');
    searchTextElement.appendChild(searchTextInput);
    fieldFilter.appendChild(searchTextElement);

    fieldFilter.appendChild(createFilterButton(dropdown.div.id, 'ff_show_native_fields', 'Native Fields'));

    // Determine what type of fields we have available so we only show filters for those types
    const customBodyFields = dropdown.valueArray.find(el => el.match(/^(custbody)/i)) ? true : false;
    const customColumnFields = dropdown.valueArray.find(el => el.match(/^(custcol)/i)) ? true : false;
    const customFields = dropdown.valueArray.find(el => el.match(/^(custitem|custrecord|custentity)/i)) ? true : false;
    const relatedTableFields = dropdown.textArray.find(el => el.match(/\.\.\.$/i)) ? true : false;

    if (customBodyFields) {
        fieldFilter.appendChild(createFilterButton(dropdown.div.id, 'ff_show_custom_body_fields', 'Custom Body Fields'));
    }

    if (customColumnFields) {
        fieldFilter.appendChild(createFilterButton(dropdown.div.id, 'ff_show_custom_column_fields', 'Custom Column Fields'));
    }

    if (customFields) {
        fieldFilter.appendChild(createFilterButton(dropdown.div.id, 'ff_show_custom_fields', 'Custom Fields'));
    }

    if (relatedTableFields) {
        fieldFilter.appendChild(createFilterButton(dropdown.div.id, 'ff_show_related_table_fields', 'Related Table Fields'));
    }

    dropdown.div.insertBefore(fieldFilter,dropdown.div.childNodes[0]);
}

// Add the Field Finder footer element to the dropdown
function addFieldFinderFooterElement(dropdown) {
    const footerDiv = document.createElement('div');
    footerDiv.setAttribute('id','footerDiv');
    footerDiv.classList.add('ff_div_footer');
    dropdown.div.appendChild(footerDiv);
}

/* Prepare Dropdown option */
function prepareDropdownOption(dropdown, opt, index) {

    if (index==0) {
        opt.style.cssText = 'display:none;';
    }

    const fieldId = dropdown.valueArray[index];
    const fieldName = dropdown.textArray[index];

    let fieldType = getFieldType(fieldId.split('_')[0].toLowerCase());

    if (fieldName.endsWith('Fields...')) {
        fieldType = 'Related Fields'
    }

    const newFieldName = fieldName.replace(/\((Custom Body|Custom Column|Custom)\)/i,'');

    opt.setAttribute('ff_fieldtype',fieldType);
    opt.setAttribute('ff_fieldname',newFieldName);
    opt.setAttribute('ff_fieldid',fieldId.toLowerCase().replace(/^(stdentity|stdbody|custom_|transaction_)/,''));
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

    // Use NetSuite native functions to get access to the dropdown
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

    // Add event listeners to handle when user clicks on field selector
    fieldSelector.addEventListener('click',handleFieldSelectorClick);
    document.getElementById(`${fieldSelector.id}_arrow`)?.addEventListener('click',handleFieldSelectorClick);

    // Prepare each option in the dropdown list
    dropdown.div.childNodes.forEach((opt, index) => prepareDropdownOption(dropdown, opt, index));

    // Add the Field Finder filter elements to the dropdown
    addFieldFinderFilterElements(dropdown);

    // Add the Field Finder footer element to the dropdown
    addFieldFinderFooterElement(dropdown);

    return true;

}

// Add a field type button filter
function createFilterButton(dropdownDivId, fieldId, title) {
    const buttonElement = document.createElement('button');
    buttonElement.classList.add('ff_button');
    buttonElement.setAttribute('onpointerdown','event.preventDefault();');
    buttonElement.setAttribute('id',fieldId);
    buttonElement.setAttribute('type','button');
    buttonElement.setAttribute('onclick',`event.stopImmediatePropagation();handleButtonClick(this,${dropdownDivId});`);
    buttonElement.setAttribute('value',0);
    buttonElement.innerText=title;
    return buttonElement;
}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleFieldSelectorClick(event) {

    try {

        const target = document.getElementById(event.target.id.replace(/\_arrow$/,''));
        const dropdown = getDropdown(target);

        /*
        * NetSuite resets the dropdown if a related table field is selected
        * so we must prep the dropdown again.
        */
        if (dropdown.div.id == '') {
            prepareDropdown(target);
        }

        if (dropdown?.currentCell) {
            const dropdownLocation = dropdown.div.getBoundingClientRect();
            const selectedOptionLocation = dropdown.currentCell.getBoundingClientRect();
            if (dropdownLocation?.x == selectedOptionLocation?.x) {
                dropdown.div.scrollBy({
                    top: -32,
                    behavior: 'instant'
                });
            }
        }
    } catch (err) {
        console.error(`An error occurred while: handling field selector click: ${err}`);
    }

    // Set focus to the text box if it exists.
    setTimeout(setFocusOnTextBox,100);

}

// Automatically set focus on text box so that user can immediately start typing a search string
function setFocusOnTextBox() {
    document.getElementById('ff_show_search_input')?.focus();
}

// Handles when a user clicks on the span containing the checkbox instead of the actual checkbox
function handleButtonClick(button, dropdownDivId) {
    if (button.value==1) {
        button.classList.remove('ff_button_enabled');
        button.value=0;
    } else {
        button.classList.add('ff_button_enabled');
        button.value=1;
    }
    filterDropdowns(dropdownDivId);
    return;
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdownDiv) {

    const showCustomBodyFields = parseInt(((document.getElementById('ff_show_custom_body_fields')||{}).value)||0);
    const showCustomColumnFields = parseInt(((document.getElementById('ff_show_custom_column_fields')||{}).value)||0);
    const showCustomFields = parseInt(((document.getElementById('ff_show_custom_fields')||{}).value)||0);
    const showRelatedTableFields = parseInt(((document.getElementById('ff_show_related_table_fields')||{}).value)||0);
    const showNativeFields = parseInt(((document.getElementById('ff_show_native_fields')||{}).value)||0);

    const searchInputField = document.getElementById('ff_show_search_input');

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
    const footerDiv = document.getElementById('footerDiv');
    if (fieldsTotal > fieldsDisplayed) {
        footerDiv.textContent=`Showing ${fieldsDisplayed} of ${fieldsTotal} fields`;
        footerDiv.style.visibility = 'visible';
    } else {
        footerDiv.style.visibility = 'hidden';
    }

    return true;

}
