/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/


// Define the Saved Search fields where we want to add filtering capability
const fieldsToFilter = "input[id^='inpt_filterfilter'],input[id^='inpt_field'],input[id^='inpt_rffield'],input[id^='inpt_fffilter'],input[id^='inpt_sort']";

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

        if (opt.textContent.includes('Fields...')) {
            fieldType = 'Related Field';
        }
        else if (opt.textContent.includes('Custom Body')) {
            fieldType = 'Custom Body';
        }
        else if (opt.textContent.includes('Custom Column')) {
            fieldType = 'Custom Column';
        }
        else {
            fieldType = 'Native Field';
        }

        opt.setAttribute('ff_fieldtype',fieldType);

        let newFieldName = fieldName.replace(/\((Custom Body|Custom Column)\)/i,'');
        opt.innerHTML = `
            <span class="ff_option" style="width:35%;">${newFieldName}</span>
            <span class="ff_option" style="width:15%;">${fieldType}</span>
            <span class="ff_option" style="width:15%;">${typeof rfTypes !== 'undefined' ? rfTypes[fieldId] : ''}</span>
            <span class="ff_option" style="width:35%;">${fieldId.substring(fieldId.indexOf('_') + 1)}</span>
        `;

        return true;
    });
    
    dropdownDiv.style.width='800px';
    dropdownDiv.id = `${fieldSelector.id}_dropdown`;

    fieldSelector.setAttribute('dropdown',dropdownDiv.id);
    fieldSelector.addEventListener('click',handleFieldSelectorClick);

    const customBodyFieldsCheckbox = document.createElement('span');
    const customColumnFieldsCheckbox = document.createElement('span');
    const relatedTableFieldsCheckbox = document.createElement('span');
    const nativeFieldsCheckbox = document.createElement('span');
    const searchInputField = document.createElement('div');

    const fieldFilter =  document.createElement('div');
    fieldFilter.classList.add('ff_div');
    fieldFilter.innerHTML = `<span class="ff_fieldspan"><input class="ff_checkbox" type="checkbox" id="ff_show_custom_body_fields" checked onpointerdown="event.preventDefault();" onclick="filterDropdowns(${dropdownDiv.id});"/> Custom Body Fields</span>`;
    fieldFilter.innerHTML += `<span class="ff_fieldspan"><input class="ff_checkbox" type="checkbox" id="ff_show_custom_column_fields" checked onpointerdown="event.preventDefault();" onclick="filterDropdowns(${dropdownDiv.id});"/> Custom Column Fields</span>`;
    fieldFilter.innerHTML += `<span class="ff_fieldspan"><input class="ff_checkbox" type="checkbox" id="ff_show_related_table_fields" checked onpointerdown="event.preventDefault();" onclick="filterDropdowns(${dropdownDiv.id});"/> Related Table Fields</span>`;
    fieldFilter.innerHTML += `<span class="ff_fieldspan"><input class="ff_checkbox" type="checkbox" id="ff_show_native_fields" checked onpointerdown="event.preventDefault();" onclick="filterDropdowns(${dropdownDiv.id});"/> Native Fields</span>`;
    fieldFilter.innerHTML += `<span class="ff_fieldspan"><input class="ff_textbox" type="text" id="ff_show_search_input" value="" onpointerdown="event.preventDefault();this.focus();" onkeydown="event.stopImmediatePropagation();" onkeypress="event.stopImmediatePropagation();" onkeyup="event.stopImmediatePropagation(); filterDropdowns(${dropdownDiv.id});" onfocus=" event.preventDefault();"></span>`;

    dropdownDiv.insertBefore(fieldFilter,dropdownDiv.childNodes[1]);

}

// Automatically scroll the div window to account for the filter settings element. Otherwise, selected field gets hidden behind it.
function handleFieldSelectorClick(event) {
    try {        
        const dropdown = getDropdown(event.target);
        if (dropdown.currentCell) {
            const currentSelectionLocation = dropdown.currentCell.getBoundingClientRect();;
            dropdown.div.scrollBy({
                top: -40,
                behavior: 'instant'
            });
        }
    } catch (err) {
        console.error(`Error occurred while trying to find current selection for scrolling: ${err}`);
    }   
}

// Show or hide options based on current Field Filter selections
function filterDropdowns (dropdownDiv) {

    const showCustomBodyFields = document.getElementById('ff_show_custom_body_fields');
    const showRelatedTableFields = document.getElementById('ff_show_related_table_fields');
    const showCustomColumnFields = document.getElementById('ff_show_custom_column_fields');
    const showNativeFields = document.getElementById('ff_show_native_fields');
    const searchInputField = document.getElementById('ff_show_search_input');

    const options = dropdownDiv.childNodes;

    options.forEach((opt, index) => {

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
            case 'Native Field':
                opt.style.display = showNativeFields.checked ? 'block' : 'none';
                break;
        };
        // Filter by field Name or field ID
        if (searchInputField.value 
            && opt.style.display == 'block'
            && !opt.textContent.toLowerCase().includes(searchInputField.value.toLowerCase())) {
            opt.style.display = 'none';
        }
        return true;
    });

    return true;

}
