/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/


// Define the Saved Search fields where we want to add filtering capability
const fieldsToFilter = "input[id^='inpt_filterfilter'],input[id^='inpt_field'],input[id^='inpt_rffield'],input[id^='inpt_fffilter']";

// Prepare the dropdowns for Field Filter
document.querySelectorAll(fieldsToFilter).forEach((el) => {
    prepareDropdown(el);
    return true;
});

// Add the Field Filter settings elements
addFieldFilterElement();

// Filter the dropdowns based on current settings
filterDropdowns();

// Find all of the Field Filter field elements and add an event listener
document.querySelectorAll("[id^='ff_show_']").forEach((el) => {
    el.addEventListener('change', filterDropdowns);
});

// Add the Field Filter form elements to the page
function addFieldFilterElement () {

    // Create the Field Filter Element on the page
    const fieldFilterDiv = document.createElement('div');
    fieldFilterDiv.setAttribute('onmouseleave','this.style.display="none"'); // Hide the div when the mouse leaves
    fieldFilterDiv.id = 'fieldFilter';
    fieldFilterDiv.classList.add('uir-tooltip');
    fieldFilterDiv.classList.add('uir-field-tooltip-wrapper');
    fieldFilterDiv.style.cssText = 'top: 250px; padding: 20px; left: 500px; width: 400px; height: 150px; display: none;';

    const customBodyFieldsCheckbox = document.createElement('div');
    const customColumnFieldsCheckbox = document.createElement('div');
    const relatedTableFieldsCheckbox = document.createElement('div');
    const nativeFieldsCheckbox = document.createElement('div');
    const searchInputField = document.createElement('div');
    searchInputField.setAttribute('id','woohooo');

    customBodyFieldsCheckbox.innerHTML = `<input type="checkbox" id="ff_show_custom_body_fields" checked> Custom Body Fields`;
    customColumnFieldsCheckbox.innerHTML = `<input type="checkbox" id="ff_show_custom_column_fields" checked> Custom Column Fields`;
    relatedTableFieldsCheckbox.innerHTML = `<input type="checkbox" id="ff_show_related_table_fields" checked> Related Table Fields`;
    nativeFieldsCheckbox.innerHTML = `<input type="checkbox" id="ff_show_native_fields" checked> Native Fields`;
    searchInputField.innerHTML = `Field Name or ID Includes&nbsp;<input type="text" id="ff_show_search_input" value="">`;
    searchInputField.style.cssText="padding-top: 10px;"

    fieldFilterDiv.appendChild(customBodyFieldsCheckbox);
    fieldFilterDiv.appendChild(customColumnFieldsCheckbox);
    fieldFilterDiv.appendChild(relatedTableFieldsCheckbox);
    fieldFilterDiv.appendChild(nativeFieldsCheckbox);
    fieldFilterDiv.appendChild(searchInputField);
    document.body.appendChild(fieldFilterDiv);

    // Determine if we are inside an iFrame or not
    if ( window.location !== window.parent.location ) {
        const fieldSelector = document.getElementById('inpt_field2');
        if (fieldSelector) {
            // Add a link to open the Field Filter beneath the field dropdown
            const fieldSelectorParent = document.getElementById('inpt_field2').parentNode;
            const newDiv = document.createElement("div");
            newDiv.innerHTML = `<a href="#" id="fieldfilter_iframe" onclick="displayFieldFilterSettings(this);">Field Filter</a>`;        
            fieldSelectorParent.appendChild(newDiv);
        }
    } else {
        const tabs = document.getElementById('tb');
        if (tabs) {
            // Add a link to open the Field Filter on the search main menu
            const row = tabs.rows[0];
            const cell = row.insertCell(row.cells.length-2);
            cell.setAttribute('valign','middle');
            cell.setAttribute('nowrap',null);
            cell.id = 'fieldfilter_tablnk';
            cell.style.className='formtabloff';
            cell.innerHTML=`<a href="#" id="fieldfilter_main" onclick="displayFieldFilterSettings(this);" class="formtabtext formtabtextoff">Field Filter</a>`;        
        }
    }

}

function displayFieldFilterSettings(element) {
    var fieldFilterElement=document.getElementById('fieldFilter');
    if (fieldFilterElement.style.display == 'block') {
        fieldFilterElement.style.display='none';
        return false;
    };
    var fieldFilterLocation = element.getBoundingClientRect();
    var leftPx = parseInt(fieldFilterLocation.x).toString() + 'px';
    var topPx = parseInt(fieldFilterLocation.y+30).toString() + 'px';
    fieldFilterElement.style.left=leftPx;
    fieldFilterElement.style.top=topPx;
    fieldFilterElement.style.display='block';
}

// Prepare the dropdown for use with Field Filter
function prepareDropdown(fieldInput) {

    const dropdown = getDropdown(fieldInput);
    dropdown.buildDiv();
    const dropdownDiv = dropdown.div;
    const options = dropdownDiv.childNodes;

    dropdownDiv.style.width='800px';

    options.forEach((opt, index) => {
        if (index==0) { return true; }

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
            <span style="width:35%;display: inline-block;">${newFieldName}</span>
            <span style="width:25%;display: inline-block;">${fieldType}</span>
            <span style="width:40%;display: inline-block;">${fieldId.substring(fieldId.indexOf('_') + 1)}</span>
        `;

        return true;
    });

}

// Show or hide options based on current Field Filter selections
function filterDropdowns () {

    const showCustomBodyFields = document.getElementById('ff_show_custom_body_fields');
    const showRelatedTableFields = document.getElementById('ff_show_related_table_fields');
    const showCustomColumnFields = document.getElementById('ff_show_custom_column_fields');
    const showNativeFields = document.getElementById('ff_show_native_fields');
    const searchInputField = document.getElementById('ff_show_search_input');
    
    document.querySelectorAll(fieldsToFilter).forEach((el) => {
        const dropdown = getDropdown(el);
        const dropdownDiv = dropdown.div;
        const options = dropdownDiv.childNodes;
        
        if (!showCustomColumnFields.checked
            || !showCustomBodyFields.checked
            || !showRelatedTableFields.checked
            || !showNativeFields.checked
            || searchInputField.value
        ) {
            options[0].textContent = 'Note - This list is being filtered by Field Filter';
            options[0].style.fontWeight='bold';
        } else {
            options[0].textContent = '';
        }

        options.forEach((opt, index) => {
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
    });

}
