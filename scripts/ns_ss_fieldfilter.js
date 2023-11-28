/*
*
* This script is injected into the site from content.js in order to access
* components of the DOM and specific NetSuite functions such as getDropdown()
*
*/

"use strict"

var ffMinimized = true;

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

var recordFieldData, recordFieldData2;

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
        button.classList.remove('ff_btn_enabled');
    });
    dropdown.fieldFinder.customBodyFields = false;
    dropdown.fieldFinder.customColumnFields = false;
    dropdown.fieldFinder.customFields = false;
    dropdown.fieldFinder.relatedTableFields = false;
    dropdown.fieldFinder.standardFields = false;
    filterDropdowns(fieldSelector);
}

var recordNameX;

function getRecordData() {

    console.log('loading record field data');

    const searchType = document.getElementById('searchtype').value;
    const rectype = document.getElementById('rectype').value;

    if (searchType == 'Custom') {
        require(['N/query'], function(query) {
            const qry = `select internalid,scriptid from CustomRecordType WHERE internalid = ${rectype};`;
            const results = query.runSuiteQL.promise({
                query: qry
            });
            results.then(result => {
                const records = result.asMappedResults();
                const recordName = records[0].scriptid.toLowerCase();
                recordNameX = recordName;
                getRecordFieldData(recordName);
            });
        });
    } else {
        getRecordFieldData(searchType.toLowerCase());
    }

    if (!recordNameX) {
        recordNameX = searchType.toLowerCase();
    };

}

function getRecordFieldData(recordName) {

    const data = {"scriptId":recordName};

    fetch(`/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data=${JSON.stringify(data)}`,{
        headers: {
            "Accept": "application/json; q=1.0, text/*; q=0.8, */*; q=0.1"
        }
    })
    .then((response) => response.json())
    .then((data) => {
            recordFieldData = data;
            console.log(recordFieldData);
            console.log('done loading record field data');

    });

    fetch(`/usr-api/recordMetadata/${recordName}`,{
        headers: {
            "Accept": "*/*"
        }
    })
    .then((response) => response.json())
    .then((data) => {
            recordFieldData2 = data;
            console.log(recordFieldData2);
            console.log('done loading record field data2');

    });

}


function displayFieldHelp(field) {
    
    document.getElementById('ff_field_help_box').innerHTML = "";
    document.getElementById('ff_field_type_box').innerHTML = "";
    //console.log(recordFieldData);

    console.log(`looking for ${field}`)

    console.log(recordNameX);

    const theField = recordFieldData.data.fields.find(e => e.id.toLowerCase() == field.toLowerCase());

    //const theField2 = recordFieldData2.fields.find(e => e.id.toLowerCase() == field.toLowerCase());

    //const theJoins = theField.joins;

    console.log(theField);

    if (!theField) {
        return;
    }

    const fieldType = getFieldType(field);

    var theContent = `
    <b>${fieldType}</b><br/>
    <b>Data Type:</b> ${theField?.dataType}<br/>
    <b>Field Type:</b> ${theField?.fieldType}</b><br/>
   `;

   if (theField.joins && theField.joins.length > 0) {
      theContent += `
      <b>Relationship:</b> ${theField.joins[0].label}<br/>${theField.joins[0].sourceTargetType.joinPairs[0].label.split("=")[1]}
      `;
   }

   if (recordNameX.startsWith("custom")) {
        recordNameX = "customrecord";
   }

   fetch(`/core/help/fieldhelp.nl?flhtp=USR&f=${field}&p=${recordNameX}`,{
        headers: {
            "Accept": "application/json; q=1.0, text/*; q=0.8, */*; q=0.1"
        }
    })
    .then((response) => response.json())
    .then((data) => {
        document.getElementById('ff_field_help_box').innerHTML = data.text;

    });

    document.getElementById('ff_field_type_box').innerHTML = theContent;


}

getRecordData();

//console.log(accountRecords);

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
    if (fieldId.match(/^(custrecord|custentity|custitem|custbody|custcol)/)) {
        fieldType = 'Custom Field';
    }
    return fieldType;
}

// Handle keys typed into the search text box
function handleKey(event, fieldSelector) {

    event.stopImmediatePropagation();

    if (event.type == 'keypress') {
        return;
    }

    const dropdown = getDropdown(fieldSelector);
    const currentCell = dropdown.indexOnDeck || 0;

    // Handle enter & tab key
    if (event.type == 'keyup' && event.key == 'Enter' || event.key == 'Tab') {
        event.preventDefault();
        dropdown.setAndClose(currentCell);
        return;
    }
    // Handle arrow keys
    else if (event.type == 'keydown' && (event.key == 'ArrowDown' || event.key == 'ArrowUp')) {
        event.preventDefault();
        if (currentCell == 0 && event.key == 'ArrowUp') {
            return;
        }
        let nextCell = event.key=='ArrowDown' ? currentCell+1 : currentCell-1;
        let nextOption = dropdown.divArray[nextCell];
        while(nextOption) {
            if (nextOption && nextOption.style.getPropertyValue('display') == 'block') {
                dropdown.respondToArrow(nextCell-currentCell);
                break;
            }
            nextCell = event.key=='ArrowDown' ? nextCell+1 : nextCell-1;
            nextOption = dropdown.divArray[nextCell];
        }
    }
    // Handle alpha-numeric keys
    else if (event.type == 'keyup' && (event.keyCode >= 48 && event.keyCode <= 90) || event.keyCode == 8 ) {
        filterDropdowns(fieldSelector);
        // Move selected option back to 0
        dropdown.respondToArrow(0-dropdown.indexOnDeck);
    }

    // Give focus back to input field
    event.target.focus();

}

// Handle when user clicks on field selector
function handleFieldSelectorClick(event) {
    try {

        // Get the target of the click and account for user clicking on arrow instead of field
        const target = document.getElementById(event.target.id.replace(/\_arrow$/,''));

        // Get the associated dropdown of the field selector
        const dropdown = getDropdown(target);

        /*
        * NetSuite resets the dropdown if a related table field is selected
        * so we must prep the dropdown again.
        */
        if (dropdown.div.id == '') {
            prepareDropdown(target);
        }

        // If there is no field selected, clear the field finder settings
        if (!dropdown.getIndex()) {
            resetFieldFinder(target);
        }

        // Set focus to the text box if it exists.
        setFocusOnTextBox();

    } catch (err) {
        console.error(`An error occurred while: handling field selector click: ${err}`);
    }
}

// Handles when a user clicks on one of the field type buttons
function handleButtonClick(button, fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
    const previousValue = dropdown.fieldFinder[button.id];

    if (previousValue) {
        button.classList.remove('ff_btn_enabled');
    } else {
        button.classList.add('ff_btn_enabled');
    }

    dropdown.fieldFinder[button.id] = previousValue ? false : true;

    // Move selected option back to 0
    dropdown.respondToArrow(0-dropdown.indexOnDeck);

    setFocusOnTextBox();

    filterDropdowns(fieldSelector);
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
    searchTextInput.setAttribute('onkeyup',`handleKey(event,${fieldSelector.id});`);
    searchTextInput.setAttribute('onkeydown',`handleKey(event,${fieldSelector.id});`);
    searchTextInput.setAttribute('onkeypress',`handleKey(event,${fieldSelector.id});`);
    searchTextInput.setAttribute('ondblclick','event.preventDefault();this.select();');
    searchTextInput.setAttribute('onclick','event.preventDefault();this.select()');

    dropdown.fieldFinder = {};
    dropdown.fieldFinder.searchInputField = fieldFilter.appendChild(searchTextInput);

    const buttonGroup = document.createElement('div');
    buttonGroup.setAttribute('class','ff_btn_group');
    buttonGroup.setAttribute('id','ff_btn_group');
    buttonGroup.style.setProperty('padding-left','20px');

    const fieldInfoDiv = document.createElement('div');
    fieldInfoDiv.classList.add('ff_field_info_box');
    fieldInfoDiv.setAttribute('id','ff_field_info_box');

    const fieldTypeDiv = document.createElement('div');
    fieldTypeDiv.classList.add('ff_field_type_box');
    fieldTypeDiv.setAttribute('id','ff_field_type_box');

    const fieldHelpDiv = document.createElement('div');
    fieldHelpDiv.classList.add('ff_field_help_box');
    fieldHelpDiv.setAttribute('id','ff_field_help_box');

    fieldInfoDiv.appendChild(fieldTypeDiv);
    fieldInfoDiv.appendChild(fieldHelpDiv);
    
    dropdown.div.insertBefore(fieldInfoDiv,dropdown.div.childNodes[0]);



    dropdown.fieldFinder.buttons = [];
    dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(fieldSelector, 'standardFields', 'Standard')));

    // Determine what type of fields we have available so we only show filters for those types
    const customFields = dropdown.valueArray.find(el => el.match(/^(custbody|custcol|custitem|custrecord|custentity)/i)) ? true : false;
    const relatedTableFields = dropdown.textArray.find(el => el.match(/\.\.\.$/i)) ? true : false;

    if (customFields) {
        dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(fieldSelector, 'customFields', 'Custom')));
    }

    if (relatedTableFields) {
        dropdown.fieldFinder.buttons.push(buttonGroup.appendChild(createFilterButton(fieldSelector, 'relatedTableFields', 'Related')));
    }

    fieldFilter.appendChild(buttonGroup);

    fieldFilter.appendChild(createFieldDetailsButton(fieldSelector));

    dropdown.fieldFinder.standardFields = false;
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
    titleElement.textContent = '';
    
    const anchorElement = document.createElement('a');
    anchorElement.href = "https://chrome.google.com/webstore/detail/netsuite-field-finder/npehdolgmmdncpmkoploaeljhkngjbne?hl=en-US&authuser=0";
    anchorElement.title='NetSuite Field Finder 0.19';
    anchorElement.textContent='NetSuite Field Finder 0.19';
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
    let newFieldId = fieldId.toLowerCase().replace(/^(stdentity|stdbody|custom_|transaction_)/,"");
    
    const searchType = document.getElementById('searchtype').value.toLowerCase();
    if (searchType != "custom") {
        newFieldId = newFieldId.replace(new RegExp(`^${searchType}_`),"");
    }

    opt.setAttribute('ff_fieldtype',fieldType);
    opt.setAttribute('ff_fieldname',newFieldName);
    opt.setAttribute('ff_fieldid',newFieldId);
    
    opt.style.setProperty('display','block');
    opt.textContent='';

    const fieldNameElement = document.createElement('span');
    fieldNameElement.classList.add('ff_option');
    fieldNameElement.style.setProperty('width','280px');
    fieldNameElement.textContent=newFieldName;
    fieldNameElement.setAttribute("onMouseOver",`displayFieldHelp('${newFieldId}');`)

    const fieldIdElement = document.createElement('span');
    fieldIdElement.classList.add('ff_option');
    fieldIdElement.style.setProperty('width','280px');

    fieldIdElement.textContent = fieldType == 'Related Fields' ? '' : opt.getAttribute('ff_fieldid');

    /*
    const fieldTypeElement = document.createElement('span');
    fieldTypeElement.classList.add('ff_option');
    fieldTypeElement.style.setProperty('width','15%');
    fieldTypeElement.textContent=fieldType;
    //fieldTypeElement.innerHTML = '<svg class="uif552 uif555 uif558 uif561" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-icon="/assets/@uif-js/core/4.0.0-feature-uicr-8075-hotfix.93/resources/img/RefreshedIcon.svg#DATE" role="img" aria-label="Date" data-border-radius="square" id="uif2106" data-widget="Image" data-status="none" style="width: 24px; height: 24px;"><path d="M13 16h1v-1h-1v-5h-3v1h1v4h-1v1h3z"></path><path d="M16 5v2h-1V5H9v2H8V5H5v14h14V5zm1.5 12.5h-11v-9h11z"></path></svg>';

    const fieldDataTypeElement = document.createElement('span');
    fieldDataTypeElement.classList.add('ff_option');
    fieldDataTypeElement.style.setProperty('width','15%');
    fieldDataTypeElement.textContent = fieldType == 'Related Fields' ? '' : typeof rfTypes == 'object' ? rfTypes[fieldId] : '';

    //fieldDataTypeElement.innerHTML = '<svg class="uif552 uif555 uif558 uif561" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-icon="/assets/@uif-js/core/4.0.0-feature-uicr-8075-hotfix.93/resources/img/RefreshedIcon.svg#DATE" role="img" aria-label="Date" data-border-radius="square" id="uif2106" data-widget="Image" data-status="none" style="width: 24px; height: 24px;"><path d="M13 16h1v-1h-1v-5h-3v1h1v4h-1v1h3z"></path><path d="M16 5v2h-1V5H9v2H8V5H5v14h14V5zm1.5 12.5h-11v-9h11z"></path></svg>';
    */


    opt.appendChild(fieldNameElement);
    opt.appendChild(fieldIdElement);
    //opt.appendChild(fieldTypeElement);
    //opt.appendChild(fieldDataTypeElement);

    return true;
}

// Prepare the dropdown for use with Field Filter
function prepareDropdown(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);

    if (!dropdown.div) {
        dropdown.buildDiv();
    }

    console.log(dropdown);

    // Increase width of the options element
    dropdown.div.style.setProperty('width','560px');
    dropdown.div.style.setProperty('margin-bottom','25px');
    dropdown.div.style.setProperty('margin-top','32px');

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
    buttonElement.setAttribute('onpointerdown','event.preventDefault();');
    buttonElement.setAttribute('id',fieldId);
    buttonElement.setAttribute('type','button');
    buttonElement.setAttribute('onclick',`event.stopImmediatePropagation();handleButtonClick(this,${fieldSelector.id});`);
    buttonElement.setAttribute('value',0);
    buttonElement.innerText=title;
    return buttonElement;
}

function handleFieldDetailsButtonClick(fieldSelector) {
    const dropdown = getDropdown(fieldSelector);
    if (ffMinimized) {
        dropdown.div.style.setProperty('width','800px');
        document.getElementById('ff_field_info_box').style.visibility = 'visible';
        ffMinimized = false;
    } else {
        dropdown.div.style.setProperty('width','560px');
        document.getElementById('ff_field_info_box').style.visibility = 'hidden';
        ffMinimized = true;
    }
}

// Add a field type button filter
function createFieldDetailsButton(fieldSelector) {
    const buttonElement = document.createElement('button');
    buttonElement.setAttribute('onpointerdown','event.preventDefault();');
    buttonElement.setAttribute('id','field_details_button');
    buttonElement.setAttribute('type','button');
    buttonElement.setAttribute('onclick',`event.stopImmediatePropagation();handleFieldDetailsButtonClick(${fieldSelector.id});`);
    buttonElement.setAttribute('value',0);
    buttonElement.innerText='Details';
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
    const showStandardFields = dropdown.fieldFinder.standardFields;
    const searchInputField = dropdown.fieldFinder.searchInputField;

    let fieldsDisplayed = 0;
    let fieldsTotal = 0;
    let filterByFieldType = false;

    if (showCustomBodyFields ||
        showCustomColumnFields ||
        showCustomFields ||
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
                opt.style.setProperty('display',showCustomBodyFields || !filterByFieldType ? 'block' : 'none');
                break;
            case 'Custom Column':
                opt.style.setProperty('display',showCustomColumnFields || !filterByFieldType ? 'block' : 'none');
                break;
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
            && opt.getAttribute('ff_fieldid').search(searchRegex)==-1) {
            opt.style.setProperty('display','none');
        }

        if (opt.style.getPropertyValue('display') != 'none' && opt.getAttribute('ff_fieldname')) {
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

