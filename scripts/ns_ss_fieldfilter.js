/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

// Define the Saved Search fields where we want to add filtering capability
const fieldsToFilter = "input[id^='inpt_filterfilter'],input[id^='inpt_field'],input[id^='inpt_rffield'],input[id^='inpt_fffilter'],input[id^='inpt_sort'],input[id^='inpt_valuefield'],input[id^='inpt_filterfield']";

// Prepare the dropdowns for Field Filter
document.querySelectorAll(fieldsToFilter).forEach((el) => {
    prepareDropdown(el);
    return true;
});

// Prepare the dropdown for use with Field Filter
function prepareDropdown(fieldSelector) {

    const dropdown = getDropdown(fieldSelector);

    dropdown.buildDiv();
    const dropdownDiv = dropdown.div;
    const options = dropdownDiv.childNodes;

    options.forEach((opt, index) => {
        if (index==0) { 
            opt.style.cssText='display:none;';
        }

        const fieldId = dropdown.valueArray[index];
        const fieldName = dropdown.textArray[index];
        let fieldType = '';
        const fieldIdPrefix = fieldId.split('_')[0].toLowerCase();

        switch(fieldIdPrefix) {
            case "custom":
                fieldType = 'Native Field';
                break;
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

        if (fieldName.endsWith('...')) {
            fieldType = 'Related Field'
        }

        let newFieldName = fieldName.replace(/\((Custom Body|Custom Column|Custom)\)/i,'');
        opt.innerHTML = `
            <span class="ff_option" style="width:35%;">${newFieldName}</span>
            <span class="ff_option" style="width:15%;">${fieldType}</span>
        `;
        if (typeof rfTypes !== 'undefined' && rfTypes[fieldId]) {
            opt.innerHTML += `<span class="ff_option" style="width:15%;">${rfTypes[fieldId]}</span>`
        } else {
            opt.innerHTML += `<span class="ff_option" style="width:15%;"></span>`
        }
        if (fieldType != 'Related Field') {
            opt.innerHTML += `<span class="ff_option" style="width:35%;">${fieldId.toLowerCase().replace(/^(stdentity|stdbody|custom_|transaction_)/,'')}</span>`
        }

        opt.setAttribute('ff_fieldtype',fieldType);
        opt.setAttribute('ff_fieldname',newFieldName);
        opt.setAttribute('ff_fieldid',fieldId);

        return true;
    });
    
    dropdownDiv.style.width='800px';
    dropdownDiv.id = `${fieldSelector.id}_dropdown`;

    fieldSelector.setAttribute('dropdown',dropdownDiv.id);
    fieldSelector.addEventListener('click',handleFieldSelectorClick);


    const fieldFilter =  document.createElement('div');
    fieldFilter.classList.add('ff_div');

    fieldFilter.appendChild(createFilterCheckbox(dropdownDiv.id, 'ff_show_native_fields', 'Native Fields'));

    // Determine what type of fields we have available so we only show filters for those types
    const customBodyFields = dropdown.valueArray.find(el => el.match(/^(custbody)/i)) ? true : false;
    const customColumnFields = dropdown.valueArray.find(el => el.match(/^(custcol)/i)) ? true : false;
    const customFields = dropdown.valueArray.find(el => el.match(/^(custitem|custrecord|custentity)/i)) ? true : false;
    const relatedTableFields = dropdown.textArray.find(el => el.match(/\.\.\.$/i)) ? true : false;

    if (customBodyFields) {
        fieldFilter.appendChild(createFilterCheckbox(dropdownDiv.id, 'ff_show_custom_body_fields', 'Custom Body Fields'));
    }

    if (customColumnFields) {
        fieldFilter.appendChild(createFilterCheckbox(dropdownDiv.id, 'ff_show_custom_column_fields', 'Custom Column Fields'));
    }

    if (customFields) {
        fieldFilter.appendChild(createFilterCheckbox(dropdownDiv.id, 'ff_show_custom_fields', 'Custom Fields'));
    }

    if (relatedTableFields) {
        fieldFilter.appendChild(createFilterCheckbox(dropdownDiv.id, 'ff_show_related_table_fields', 'Related Table Fields'));
    }

    fieldFilter.innerHTML += `<span onclick="event.preventDefault();"><input class="ff_textbox" type="text" id="ff_show_search_input" value="" onmouseup="event.stopPropagation();this.focus();"  onkeydown="event.stopImmediatePropagation();" onkeypress="event.stopImmediatePropagation();" onkeyup="event.stopImmediatePropagation();filterDropdowns(${dropdownDiv.id});" ondblclick="event.preventDefault();this.select();"></span>`;
    dropdownDiv.insertBefore(fieldFilter,dropdownDiv.childNodes[1]);

    /*
    * The following code detects if the selected option is at the top of the div
    * and beneath the filtering fields. If it is, it scrolls the div so that it is visible.
    */
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.attributeName=='class' && mutation.target.className=='dropdownSelected') {
                let offsetDiff = mutation.target.offsetTop-mutation.target.parentElement.scrollTop;
                if (offsetDiff<28) {
                    mutation.target.parentElement.scrollBy({
                        top: -32+offsetDiff,
                        behavior: 'instant'
                    });
                }
            }
        }
    };
    const observer = new MutationObserver(callback);
    const config = { attributes: true, childList: false, subtree: true };
    observer.observe(dropdownDiv, config);

}

function createFilterCheckbox(dropdownDivId, fieldId, title) {
    const labelElement = document.createElement('label');
    labelElement.setAttribute('for',fieldId);
    labelElement.classList.add('ff_fieldspan');
    labelElement.setAttribute('onpointerdown','event.preventDefault();');
    const checkbox = document.createElement('input');
    checkbox.classList.add('ff_checkbox');
    checkbox.setAttribute('type','checkbox');
    checkbox.setAttribute('id',fieldId);
    checkbox.setAttribute('checked','');
    checkbox.setAttribute('onpointerdown','event.preventDefault();');
    checkbox.setAttribute('onclick',`event.stopImmediatePropagation();filterDropdowns(${dropdownDivId});`);
    labelElement.appendChild(checkbox);
    const textElement = document.createTextNode(title);
    labelElement.appendChild(textElement);
    return labelElement;
}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleFieldSelectorClick(event) {
    try {        
        const dropdown = getDropdown(event.target);
        if (dropdown.currentCell) {
            const currentSelectionLocation = dropdown.currentCell.getBoundingClientRect();
            dropdown.div.scrollBy({
                top: -40,
                behavior: 'instant'
            });
        }
    } catch (err) {
        console.error(`Error occurred while trying to find current selection for scrolling: ${err}`);
    }   
}

// Handles when a user clicks on the span containing the checkbox instead of the actual checkbox
function handleSpanClick(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    checkbox.checked = checkbox.checked ? false : true;
    return;
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdownDiv) {

    const showCustomBodyFields = document.getElementById('ff_show_custom_body_fields') || false;
    const showCustomColumnFields = document.getElementById('ff_show_custom_column_fields') || false;
    const showCustomFields = document.getElementById('ff_show_custom_fields') || false;
    const showRelatedTableFields = document.getElementById('ff_show_related_table_fields') || false;
    const showNativeFields = document.getElementById('ff_show_native_fields') || false;
    const searchInputField = document.getElementById('ff_show_search_input') || false;

    dropdownDiv.childNodes.forEach((opt, index) => {

        if (index == 0) {
            return true;
        }

        // Filter by field type
        switch(opt.getAttribute('ff_fieldtype')) {
            case 'Related Field':
                opt.style.display = showRelatedTableFields.checked ? 'block' : 'none';
                break;
            case 'Custom Body':
                opt.style.display = showCustomBodyFields.checked ? 'block' : 'none';
                break;
            case 'Custom Column':
                opt.style.display = showCustomColumnFields.checked ? 'block' : 'none';
                break;
            case 'Custom Field':
                opt.style.display = showCustomFields.checked ? 'block' : 'none';
                break;
            case 'Native Field':
                opt.style.display = showNativeFields.checked ? 'block' : 'none';
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

        if (opt.style.display != 'none') {
            if (searchText != '') {
                const newFieldNameHTML = opt.getAttribute('ff_fieldname').replace(searchRegex, '<mark class="highlight">$&</mark>');
                opt.children[0].innerHTML = newFieldNameHTML;
                if (opt.getAttribute('ff_fieldtype') != 'Related Field') {
                    const newFieldIdHTML = opt.getAttribute('ff_fieldid').toLowerCase().replace(searchRegex, '<mark class="highlight">$&</mark>');
                    opt.children[3].innerHTML = newFieldIdHTML;
                }
            } else {
                opt.children[0].innerHTML = opt.getAttribute('ff_fieldname');
                if (opt.getAttribute('ff_fieldtype') != 'Related Field') {
                    opt.children[3].innerHTML = opt.getAttribute('ff_fieldid').toLowerCase();
                }
            }
        }

        return true;
    });

    return true;

}
