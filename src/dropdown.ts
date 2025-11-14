import { machinesThatSupportMultiSelect, relatedTableDataIds } from "./constants";

// Define field widths for field attributes
declare var rfTypes:any;
declare var ffTypes:any;
declare var setFfType:Function;
declare var setRfType:Function;
declare var fieldFinderVersion:string;

enum FieldAttributeWidths {
    dataType = 80,
    fieldType = 112,
    fieldName = 280,
    fieldId = 280,
    multiFunction = 24
};

export enum FieldType {
    RELATED = 'Related Fields',
    CUSTOM = 'Custom Field',
    CUSTOM_BODY = 'Custom Body',
    CUSTOM_COLUMN = 'Custom Column',
    STANDARD = '',
    FORMULA = 'Formula Field'
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

export class FieldFinderDropdownOption {
    
    hidden: boolean;
    element: HTMLDivElement;
    fieldType: FieldType;
    fieldName: string;
    fieldId: string;
    index: number;
    fieldIdElement: HTMLSpanElement;
    fieldIdTextElement: HTMLSpanElement;
    fieldIdCopyElement: HTMLSpanElement;
    fieldNameElement: HTMLSpanElement;
    fieldTypeElement: HTMLSpanElement;
    dataTypeElement: HTMLSpanElement;
    multiEditElement: HTMLSpanElement;
    dropdown: FieldFinderDropdown;

    constructor(dropdown:FieldFinderDropdown, index:number) {
        this.element = dropdown.nsDropdown.divArray[index];
        this.dropdown = dropdown;
        this.index = index;
        this.hidden = false;
        this.fieldIdElement = document.createElement('span');
        this.fieldIdTextElement = document.createElement('span');
        this.fieldIdCopyElement = document.createElement('span');
        this.fieldNameElement = document.createElement('span');
        this.fieldTypeElement = document.createElement('span');
        this.dataTypeElement = document.createElement('span');
        this.multiEditElement = document.createElement('span');
        this.fieldId = dropdown.nsDropdown.valueArray[index];
        this.fieldName = dropdown.nsDropdown.textArray[index].replace(/\((Custom Body|Custom Column|Custom)\)/i,'');
        this.fieldType = this.getFieldType();
        this.buildOptionElements();
        return this;
    };

    buildOptionElements() {
        this.element.removeChild(this.element.childNodes[0]);
        this.addMultiFunctionElement();
        this.addFieldNameElement();
        const attributeSettings = this.dropdown.settings.attributes;
        if (attributeSettings.fieldId) this.addFieldIdElement();
        if (attributeSettings.fieldType) this.addFieldTypeElement();
        if (attributeSettings.dataType) this.addDataTypeElement();
        if (this.dropdown.multiSelect == true
            && this.fieldId != ''
            && this.fieldType != 'Related Fields') {
            this.enableMultiSelect();
        }
        if (this.dropdown.settings.features.relatedTableExpansion && this.fieldType == 'Related Fields') {
            this.enableRelatedFieldsExpansion();
        }
    }

    select() {
        this.multiEditElement.classList.add('ff_multiedit_selected');
    }

    unselect() {
        this.multiEditElement.classList.remove('ff_multiedit_selected');
    }

    prettyFieldId() {
        var prefixes = ['stdentity','stdbody','custom_','transaction_'];
        if (this.dropdown.searchType)
            prefixes.push(`${this.dropdown.searchType.toLowerCase()}_`);
        return this.fieldId.toLowerCase().replace(new RegExp(`(${prefixes.join("|")})`),'');
    }

    getFieldType() {
        let fieldId = this.fieldId.toLowerCase();
        if (fieldId.match(/^(custbody)/))
            return FieldType.CUSTOM_BODY;
        else if (fieldId.match(/^(custcol)/))
            return FieldType.CUSTOM_COLUMN;
        else if (fieldId.match(/^(custcol|custrecord|custentity|custitem)/))
            return FieldType.CUSTOM;
        else if (fieldId.match(/\_formula/))
            return FieldType.FORMULA;
        else if (this.fieldName.endsWith('Fields...'))
            return FieldType.RELATED
        else
            return FieldType.STANDARD
    }

    addMultiFunctionElement() {
        this.multiEditElement.style.setProperty('width',`${FieldAttributeWidths.multiFunction}px`);
        this.multiEditElement.classList.add('ff_option');
        this.multiEditElement.style.setProperty('text-align','center');
        this.element.appendChild(this.multiEditElement);
    }

    addFieldIdElement() {
        this.fieldIdElement.classList.add('ff_option');
        this.fieldIdElement.style.setProperty('width',`${FieldAttributeWidths.fieldId}px`);
        this.fieldIdElement.style.visibility = this.dropdown.settings.attributes.fieldId ? 'visible': 'hidden';
        this.fieldIdElement.classList.add('ff_copy_fieldid');
        this.fieldIdTextElement.textContent = this.fieldType == 'Related Fields' ? '' : this.prettyFieldId() || '';
        this.fieldIdCopyElement.classList.add('ff_copy_fieldid_icon');
        this.fieldIdCopyElement.classList.add('ff_copy_fieldid_icon_copy');
        this.fieldIdTextElement.classList.add('ff_copy_fieldid_text');
        this.fieldIdElement.appendChild(this.fieldIdTextElement);
        this.fieldIdElement.appendChild(this.fieldIdCopyElement);

        if (this.fieldType == FieldType.RELATED) {
            this.fieldIdElement.style.setProperty('pointer-events', 'none');
        }
        this.fieldIdElement.addEventListener('mouseenter', (event: MouseEvent) => {
            const targetElement = event.target as HTMLElement;
            if (targetElement) {
                targetElement.children[1].classList.remove('ff_copy_fieldid_icon_confirm');
                targetElement.children[1].classList.add('ff_copy_fieldid_icon_copy');
                targetElement.children[1].classList.add('make_visible');
            }
        });

        this.fieldIdElement.addEventListener('mouseleave', (event: MouseEvent) => {
            const targetElement = event.target as HTMLElement;
            if (targetElement) {
                targetElement.children[1].classList.remove('make_visible');
            }
        });

        this.fieldIdElement.setAttribute('onmouseup','event.preventDefault();event.stopImmediatePropagation();');

        this.fieldIdElement.addEventListener('click',(event: MouseEvent)=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            const targetElement = event.target as HTMLElement;
            copyTextToClipboard(this.prettyFieldId());
            targetElement.children[1].classList.add('ff_copy_fieldid_icon_confirm');
        });

        this.element.appendChild(this.fieldIdElement);
    }

    addFieldNameElement() {
        this.fieldNameElement.classList.add('ff_option');
        this.fieldNameElement.style.setProperty('width',`${FieldAttributeWidths.fieldName}px`);
        this.fieldNameElement.textContent=this.fieldName;
        this.element.appendChild(this.fieldNameElement);
    }

    addFieldTypeElement() {
        this.fieldTypeElement.classList.add('ff_option');
        this.fieldTypeElement.style.setProperty('width',`${FieldAttributeWidths.fieldType}px`);
        this.fieldTypeElement.textContent=this.fieldType;
        this.fieldTypeElement.style.visibility = this.dropdown.settings.attributes.fieldType ? 'visible': 'hidden';
        this.element.appendChild(this.fieldTypeElement);
    }

    addDataTypeElement() {
        this.dataTypeElement.classList.add('ff_option');
        this.dataTypeElement.style.setProperty('width',`${FieldAttributeWidths.dataType}px`);


        if (this.dropdown.nsDropdown.name == 'fffilter' && typeof ffTypes == 'object') {
            this.dataTypeElement.textContent = ffTypes[this.fieldId];
        }
        else if (this.dropdown.nsDropdown.name == 'filterfilter' && typeof ffTypes == 'object') {
            this.dataTypeElement.textContent = ffTypes[this.fieldId];
        }
        else if (this.dropdown.nsDropdown.name == 'rffield' && typeof rfTypes == 'object') {
            this.dataTypeElement.textContent = rfTypes[this.fieldId];
        }
        else {
            this.dataTypeElement.textContent = '';
        }

        this.dataTypeElement.style.visibility = this.dropdown.settings.attributes.dataType ? 'visible': 'hidden';
        this.element.appendChild(this.dataTypeElement);
    }

    enableMultiSelect() {
        this.multiEditElement.classList.add('ff_multiedit');
        this.multiEditElement.setAttribute('onmouseup','event.preventDefault();event.stopImmediatePropagation();');
        this.multiEditElement.setAttribute('onclick',"event.preventDefault();event.stopImmediatePropagation();");
        this.multiEditElement.addEventListener('pointerup',()=>{handleMultiSelectClick(this.dropdown,this.fieldId)});
    }

    enableRelatedFieldsExpansion() {
        if (this.dropdown.relatedTablesAdded.includes(`${this.dropdown.nsDropdown.hddn?.machine?.name}_${this.fieldId}`))
            this.multiEditElement.classList.add('ff_expandrelated_added');
        else
            this.multiEditElement.classList.add('ff_expandrelated');
        this.multiEditElement.setAttribute('onmouseup','event.preventDefault();event.stopImmediatePropagation();');
        this.multiEditElement.setAttribute('onclick',"event.preventDefault();event.stopImmediatePropagation();");    
        this.multiEditElement.addEventListener('pointerup',(event)=>{handleRelatedTableClick(this.dropdown,this.fieldId)});
    }

    filterOption() {
        this.filterOnFieldType();
        if (!this.hidden) {
            this.filterOnTextString();
        }
    }

    filterOnFieldType () {
        const showCustomFields = this.dropdown.fieldTypeStatus.customFields;
        const showRelatedTableFields = this.dropdown.fieldTypeStatus.relatedTableFields;
        const showStandardFields = this.dropdown.fieldTypeStatus.standardFields;
        const showFormulaFields = this.dropdown.fieldTypeStatus.formulaFields;
        const set = new Set([showCustomFields,showRelatedTableFields,showStandardFields,showFormulaFields]);
        if (set.size == 1) {
            this.show();
            return;
        }
        if (this.fieldType == FieldType.RELATED)
            (showRelatedTableFields) ? this.show() : this.hide();
        else if (this.fieldType == FieldType.CUSTOM || this.fieldType == FieldType.CUSTOM_BODY || this.fieldType == FieldType.CUSTOM_COLUMN)
            (showCustomFields) ? this.show() : this.hide();
        else if (this.fieldType == FieldType.FORMULA)
            (showFormulaFields) ? this.show() : this.hide();
        else if (this.fieldType == FieldType.STANDARD)
            (showStandardFields) ? this.show() : this.hide();
    }
    
    filterOnTextString() {
        const searchInputField = this.dropdown.searchInputField;
        const searchText = searchInputField.value;
        if (!searchText) {
            this.resetOptionToOriginal();
            return;
        }
        const searchRegex = new RegExp(searchText, 'gi');
        if (searchRegex.test(this.fieldName || '')==false
            && (!this.dropdown.settings.attributes.fieldId 
                || searchRegex.test(this.prettyFieldId() || '')==false)) {
            this.hide();
            this.resetOptionToOriginal();
        }
        else {

            this.highlightMatchedText();
            this.show();
        }
    }

    highlightMatchedText() {
        const searchInputField = this.dropdown.searchInputField;
        const searchText = searchInputField.value;
        const searchRegex = new RegExp(searchText, 'gi');
        if (this.fieldName && searchText != '') {
            this.fieldNameElement.innerHTML = (this.fieldName || '').replace(searchRegex, '<mark class="highlight">$&</mark>');
            if (this.fieldType != FieldType.RELATED && this.dropdown.settings.attributes.fieldId)
                this.fieldIdTextElement.innerHTML = this.prettyFieldId().replace(searchRegex, '<mark class="highlight">$&</mark>');
        }
    }

    resetOptionToOriginal() {
        this.fieldNameElement.innerHTML = this.fieldName || '';
        if (this.fieldType != FieldType.RELATED)
            this.fieldIdTextElement.textContent = this.prettyFieldId();
    }

    hide() {
        this.element.style.setProperty('display','none');
        this.hidden = true;
    }

    show() {
        this.element.style.setProperty('display','block');
        this.hidden = false;
    }

}

export class FieldFinderDropdown {
    nsDropdown: any;
    searchType: string;
    recType: number;
    fieldsTotal = 0;
    fieldsDisplayed = 0;
    multiSelect = false;
    fieldTypeStatus:FieldTypeStatus = {
        standardFields: false,
        relatedTableFields: false,
        customFields: false,
        formulaFields: false
    };
    searchInputField = document.createElement('input');
    fieldFinderElement = document.createElement('div');
    footer = document.createElement('div');
    relatedTablesAdded: String[] = [];
    settings: FieldFinderSettings;
    options = [] as FieldFinderDropdownOption[]
    selectedOptions = [] as FieldFinderDropdownOption[];
    customOptions: FieldFinderDropdownOption[] = [];
    standardOptions: FieldFinderDropdownOption[] = [];
    relatedOptions: FieldFinderDropdownOption[] = [];
    formulaOptions: FieldFinderDropdownOption[] = [];
    hasRelatedTableFields = false;
    hasCustomFields = false;
    hasFormulaFields = false;
    buttons: FieldFinderButtons = {};
    hasMachine = false;

    constructor(nsDropdown:any, searchType: string, recType: number, settings: FieldFinderSettings) {
        this.nsDropdown = nsDropdown;
        this.settings = settings;
        this.searchType = searchType;
        this.recType = recType;
        this.init();
        return this;
    }

    init() {
        if (machinesThatSupportMultiSelect.includes(this.nsDropdown.hddn?.machine?.name))
            this.hasMachine = true;
        if (!this.nsDropdown.div)
            this.nsDropdown.buildDiv();
        this.setDropdownWidth();
        this.enableMultiSelectIfAvailable();
        this.configureFieldClickHandler();
        this.prepareDropdownOptions();
        this.addFieldFinderFilterElements();
        this.addFieldFinderFooterElement();
        this.configureAutoFocusOnTextBox();
        this.nsDropdown.div.fieldFinderLoaded = true;
    }

    enableMultiSelectIfAvailable() {
        if (this.hasMachine)
            this.multiSelect = true;
    }

    prepareDropdownOptions() {
        this.options = [];
        this.nsDropdown.valueArray.forEach((fieldId:string, index:number) => {
            let newOpt = new FieldFinderDropdownOption(this,index);
            this.options.push(newOpt);
            if (newOpt.fieldType == FieldType.CUSTOM || newOpt.fieldType == FieldType.CUSTOM_BODY || newOpt.fieldType == FieldType.CUSTOM_COLUMN) {
                this.customOptions.push(newOpt);
                this.hasCustomFields = true;
            }
            else if (newOpt.fieldType == FieldType.RELATED) {
                this.relatedOptions.push(newOpt);
                this.hasRelatedTableFields = true;
            }
            else if (newOpt.fieldType == FieldType.FORMULA) {
                this.formulaOptions.push(newOpt);
                this.hasFormulaFields = true;
            }
            else
                this.standardOptions.push(newOpt);
            return true;
        });
    }

    softReload() {
        this.setDropdownWidth();
        this.prepareDropdownOptions();
        this.nsDropdown.div.insertBefore(this.fieldFinderElement,this.nsDropdown.div.childNodes[0]);
        this.nsDropdown.div.appendChild(this.footer);
        this.nsDropdown.div.fieldFinderLoaded = true;
    }

    configureFieldClickHandler() {
        this.nsDropdown.inpt.addEventListener('click',()=>{handleFieldSelectorClick(this)});
        document.getElementById(`${this.nsDropdown.inpt.id}_arrow`)?.addEventListener('click',()=>{handleFieldSelectorClick(this)});
    }

    createFilterButton(fieldId:string, title:string) {
        const buttonElement = document.createElement('button');
        buttonElement.setAttribute('onpointerdown','event.preventDefault();');
        buttonElement.setAttribute('id',fieldId);
        buttonElement.setAttribute('type','button');
        buttonElement.setAttribute('value','0');
        buttonElement.innerText=title;
        buttonElement.addEventListener('click',()=>{handleButtonClick(this,buttonElement)});
        return buttonElement;
    }

    toggleFieldTypeFilter(button:HTMLButtonElement) {
        const buttonStatus = button.classList.toggle('ff_btn_enabled');
        const buttonId = button.id;
        this.fieldTypeStatus[buttonId as keyof FieldTypeStatus] = buttonStatus;
        this.nsDropdown.respondToArrow(0-this.nsDropdown.indexOnDeck); // Move selected option back to 0
        this.setFocusOnTextBox();
        this.filterDropdown();
    }

    setFocusOnTextBox() {
        this.searchInputField?.focus();
    }

    configureAutoFocusOnTextBox() {
        this.nsDropdown.inpt.addEventListener("focus", (event:FocusEvent) => {
            this.setFocusOnTextBox();
        });
    }

    setDropdownWidth() {
        var dropdownWidth = 800;
        if (!this.settings.attributes.dataType)
            dropdownWidth = dropdownWidth-FieldAttributeWidths.dataType;
        if (!this.settings.attributes.fieldType)
            dropdownWidth = dropdownWidth-FieldAttributeWidths.fieldType;
        if (!this.settings.attributes.fieldId)
            dropdownWidth = dropdownWidth-FieldAttributeWidths.fieldId;
        dropdownWidth = (dropdownWidth < 450) ? 450 : dropdownWidth; // Minimum width is 450
        this.nsDropdown.div.style.setProperty('width',`${dropdownWidth}px`);
        this.nsDropdown.div.style.setProperty('margin-bottom','25px');
        this.nsDropdown.div.style.setProperty('margin-top','32px');
    }

    addButtons() {
        const buttonGroup = document.createElement('div');
        buttonGroup.setAttribute('class','ff_btn_group');
        buttonGroup.setAttribute('id','ff_btn_group');
        buttonGroup.style.setProperty('padding-left','20px');
        this.buttons.standard = buttonGroup.appendChild(this.createFilterButton('standardFields', 'Standard'));
        if (this.hasCustomFields)
            this.buttons.custom = buttonGroup.appendChild(this.createFilterButton('customFields', 'Custom'));
        if (this.hasRelatedTableFields)
            this.buttons.related = buttonGroup.appendChild(this.createFilterButton('relatedTableFields', 'Related'));
        if (this.hasFormulaFields)
            this.buttons.formula = buttonGroup.appendChild(this.createFilterButton('formulaFields', 'Formula'));
        this.fieldFinderElement.appendChild(buttonGroup);
    }

    addTextBox() {
        this.searchInputField.classList.add('ff_textbox');
        this.searchInputField.setAttribute('placeholder','Filter by Name or ID');
        this.searchInputField.setAttribute('type','text');
        this.searchInputField.setAttribute('id','ff_show_search_input');
        this.searchInputField.setAttribute('onmouseup','event.stopPropagation();this.focus();');
        this.searchInputField.setAttribute('ondblclick','event.preventDefault();this.select();');
        this.searchInputField.setAttribute('onclick','event.preventDefault();this.select()');
        this.searchInputField.setAttribute('autocomplete','off');
        this.searchInputField.addEventListener('keydown',(event)=>{
            event.stopPropagation();
            handleKey(event.key,event.type,this);
        });
        this.searchInputField.addEventListener('keyup',(event)=>{
            event.stopPropagation();
            handleKey(event.key,event.type,this);
        });
        this.searchInputField.addEventListener('keypress',(event)=>{event.stopPropagation()});
        this.fieldFinderElement.appendChild(this.searchInputField);
    }

    // Add the Field Finder filter elements to the dropdown
    addFieldFinderFilterElements() {
        this.fieldFinderElement.classList.add('ff_div');
        this.fieldFinderElement.setAttribute('onclick','event.preventDefault();');
        this.fieldFinderElement.setAttribute('onpointerdown','event.preventDefault();');
        this.addTextBox();
        this.addButtons();
        this.nsDropdown.div.insertBefore(this.fieldFinderElement,this.nsDropdown.div.childNodes[0]);
    }

    addFieldFinderFooterElement() {

        const footerDiv = document.createElement('div');
        const filterStatusElement = document.createElement('span');
        const titleElement = document.createElement('span');
        const anchorElement = document.createElement('a');
    
        footerDiv.setAttribute('id','footerDiv');
        footerDiv.classList.add('ff_div_footer');
        filterStatusElement.setAttribute('id','ffFilterStatus');
        filterStatusElement.classList.add('ff_status');
        footerDiv.appendChild(filterStatusElement);
        titleElement.setAttribute('id','ffTitle');
        titleElement.classList.add('ff_title');
        titleElement.textContent = '';
        
        anchorElement.href = "https://chrome.google.com/webstore/detail/netsuite-field-finder/npehdolgmmdncpmkoploaeljhkngjbne?hl=en-US&authuser=0";
        anchorElement.title=`NetSuite Field Finder ${fieldFinderVersion}`;
        anchorElement.textContent=`NetSuite Field Finder ${fieldFinderVersion}`;
        anchorElement.setAttribute('onpointerdown',`event.preventDefault();event.stopImmediatePropagation();window.open('${anchorElement.href}','_blank');`);
        anchorElement.setAttribute('onmousedown','event.preventDefault();event.stopImmediatePropagation();');
        anchorElement.setAttribute('onclick','event.preventDefault();event.stopImmediatePropagation();');
    
        titleElement.appendChild(anchorElement);
        footerDiv.appendChild(titleElement);
    
        this.footer = this.nsDropdown.div.appendChild(footerDiv);
    
    }

    selectField(fieldId:string) {

        const machine:any = this.nsDropdown.hddn?.machine;

        if (!machine) return;

        const fieldToSearch:any = {
            "detailfields": "dffield",
            "returnfields": "rffield",
            "filterfields": "field"
        };

        // Determine if field has already been added to return lines.
        const indexOfField = machine.dataManager.findFieldValueLineNum(fieldToSearch[machine.name],fieldId);

        // If it has not, add it.
        if (indexOfField == -1) {
            machine.clearline(true);
            machine.insertdata(fieldId,machine.currentRowNum);
        }
        // Otherwise, delete it.
        else {
            machine.deleteline(indexOfField, true);
        }

        machine.clearline(); // If we don't clear the line NS will prompt user to fill in field when they click save
        machine.buildtable(); // Rebuild the results table

    }

    showNumberOfFieldsDisplayed() {
        const ffFilterStatus = this.footer.childNodes[0];
        ffFilterStatus.textContent=`Showing ${this.fieldsDisplayed} of ${this.fieldsTotal} fields.`;
    }
    
    reset() {
        this.searchInputField.value = '';
        this.buttons.custom?.classList.remove('ff_btn_enabled');
        this.buttons.related?.classList.remove('ff_btn_enabled');
        this.buttons.standard?.classList.remove('ff_btn_enabled');
        this.buttons.formula?.classList.remove('ff_btn_enabled');
        this.fieldTypeStatus.customFields = false;
        this.fieldTypeStatus.relatedTableFields = false;
        this.fieldTypeStatus.standardFields = false;
        this.fieldTypeStatus.formulaFields = false;
        this.filterDropdown();
    }

    filterDropdown () {
        this.fieldsDisplayed = 0;
        this.fieldsTotal = 0;
        this.options.forEach((opt:FieldFinderDropdownOption) => {
            this.fieldsTotal++;
            opt.filterOption();
            if (!opt.hidden)
                this.fieldsDisplayed++;
            return true;
        });
        this.showNumberOfFieldsDisplayed();
    }

    // Returns selected fields of related NetSuite machine
    getSelectedFields() {
        const nsMachine = this.nsDropdown.hddn.machine;
        return nsMachine.dataManager.getLineArray().map((selectedField:String[])=>{return selectedField[0];});
    }

    refreshMultiSelectOptions() {
        const selectedFields = this.getSelectedFields();
        for (let selOpt of this.selectedOptions) {
            selOpt.unselect();
        }
        this.selectedOptions = [];
        for (let f of selectedFields) {
            const dropdownIndex = this.nsDropdown.valueToIndexMap[f];
            const dropdownOption = this.options[dropdownIndex];
            if (!dropdownOption) continue;
            dropdownOption.select();
            this.selectedOptions.push(dropdownOption);
        }
    }

    relatedTableUrl(machineName:string,tableId:string) {
        const urls = {
            filters: `/app/common/search/search.nl?join=${tableId}&searchtype=${this.searchType}&ifrmcntnr=T&rectype=${this.recType}`,
            returnfields: `/app/common/search/search.nl?resultjoin=${tableId}&sel=returnfields&mach=returnfields&searchtype=${this.searchType}&ifrmcntnr=T&rectype=${this.recType}`,
            summaryfilters: `/app/common/search/search.nl?resultjoin=${tableId}&sel=filterfilter&mach=summaryfilters&searchtype=${this.searchType}&ifrmcntnr=T&rectype=${this.recType}`,
            field: `/app/common/search/search.nl?formulajoin=${tableId}&filterformula=T&field=formula&useids=F&searchtype=${this.searchType}&ifrmcntnr=T&rectype=${this.recType}`,
            detailfields: `/app/common/search/search.nl?resultjoin=${tableId}&sel=dffield&mach=detailfields&searchtype=${this.searchType}&ifrmcntnr=T&rectype=${this.recType}`,
            filterfields: `/app/common/search/search.nl?ffjoin=${tableId}&searchtype=${this.searchType}&rectype=${this.recType}&ifrmcntnr=T`
        } as RelatedTableUrls;
        return urls[machineName as keyof RelatedTableUrls];
    }
    
    
    // TODO: Add this back after release of 0.26
    /*
    async getRelatedTableFieldTypes(parsedHTMLDoc:Document) {
        const scriptTag = parsedHTMLDoc.querySelector(`script[src^='/app/common/search/search.nl__ifrmcntnr']`) as HTMLScriptElement;
        const httpResponse = await fetch(scriptTag.src);
        const htmlText = await httpResponse.text();  
        const parsedJs = acorn.parse(htmlText,{ecmaVersion: 11});
        for (let stmt of parsedJs.body) {
            let expr = stmt.expression;
            let fieldId = '';
            let fieldType = '';
            let fieldGroupType = '';
            if (expr && expr.type == 'AssignmentExpression'
                && expr.left.type == 'MemberExpression'
                && expr.left?.object?.name =='ffjTypes'
                && expr.right?.type=='Literal') {
                fieldId = expr.left.property.value;
                fieldType = expr.right.value;
                setFfType(fieldId,fieldType);
            }
        }
    }
    */

    getRelatedTableLabelName(parsedHTMLDoc:Document) {
        const joinLabelElement =  parsedHTMLDoc.querySelector("input[id='joinlabel']") as HTMLInputElement;
        return joinLabelElement.value;
    }

    getRelatedTableFields(parsedHTMLDoc:Document) {
        const machineName = this.nsDropdown.hddn?.machine?.name || this.nsDropdown.name;
        const dataFieldName = relatedTableDataIds[machineName];
        const dataFieldsElement = parsedHTMLDoc.querySelector(`div[data-name='${dataFieldName}']`) as HTMLDivElement;
        // TODO: Add this back after release of 0.26
        /*if (machineName == 'filterfields') {
            this.getRelatedTableFieldTypes(parsedHTMLDoc)
            .catch((error) => {
                console.error(`An error occurred while loading field types of related fields: ${error}`);
            });
        }*/
        return JSON.parse(dataFieldsElement.getAttribute("data-options") || '');
    }

    async getRelatedTableDetails(tableId: string) {
        const machineName = this.nsDropdown.hddn?.machine?.name || this.nsDropdown.name;
        const url = this.relatedTableUrl(machineName,tableId.replace(/^\_/,''));
        const httpResponse = await fetch(url);
        if (httpResponse.status != 200)
            throw new Error(`HTTP error while retrieving related fields.`);
        const htmlText = await httpResponse.text();
        const parsedHTMLDoc = new DOMParser().parseFromString(htmlText, "text/html") || "";
        return {
            fields: this.getRelatedTableFields(parsedHTMLDoc), 
            labelName: this.getRelatedTableLabelName(parsedHTMLDoc)
        };
    }
    
    async addRelatedTableFields(tableId: string) {
        var relatedTableDetails:any;
        const machineName = this.nsDropdown.hddn?.machine?.name || this.nsDropdown.name;
        if (this.relatedTablesAdded.includes(`${machineName}_${tableId}`))
            return false; // Ignore if we have already added this table
        const selectedIndex = this.nsDropdown.getIndexForValue(tableId); // Get index where user clicked
        if (!selectedIndex)
            return false;

        try {
            relatedTableDetails = await this.getRelatedTableDetails(tableId);
        } catch (err) {
            console.error(`An error occurred while trying to retrieve related fields: ${err}`);
            return false;
        }

        // Close the current dropdown
        this.nsDropdown.close();

        // Add all of the related fields to the current active dropdown
        var insertAtLineNumber = selectedIndex+1;
        for (let field of relatedTableDetails.fields) {
            if (field.value == '')
                continue;
            this.nsDropdown.addOption(`${relatedTableDetails.labelName} : ${field.text}`,field.value,insertAtLineNumber);
            if (machineName == 'returnfields')
                setRfType(field.value,'');
            insertAtLineNumber++;
        }
        this.relatedTablesAdded.push(`${machineName}_${tableId}`);
        this.nsDropdown.buildDiv(); // Rebuild the DIV now that we have added new fields
        this.softReload(); // Reloads Field finder
        this.nsDropdown.open(); // Open the dropdown back up
        this.nsDropdown.setCurrentCellInMenu(this.nsDropdown.divArray[selectedIndex]); // Jump to the first option of added fields
        this.nsDropdown.currentCell.scrollIntoView(true);
        return true;
    }

    handleEnterOrTabKey() {
        const currentCell = this.nsDropdown.indexOnDeck || 0;
        this.nsDropdown.setAndClose(currentCell);
        return;
    }

    handleArrowKey(key: string) {
        const currentCell = this.nsDropdown.indexOnDeck || 0;
        if (currentCell == 0 && key == 'ArrowUp') {
            return;
        }
        let nextCell = key=='ArrowDown' ? currentCell+1 : currentCell-1;
        let nextOption = this.options[nextCell];
        while(nextOption) {
            if (!nextOption.hidden) {
                this.nsDropdown.respondToArrow(nextCell-currentCell);
                break;
            }
            nextCell = key=='ArrowDown' ? nextCell+1 : nextCell-1;
            nextOption = this.options[nextCell];
        }
    }

    handleAlphaNumericKey() {
        this.filterDropdown();
        this.nsDropdown.respondToArrow(0-this.nsDropdown.indexOnDeck);
    }

}

// Handles when a user clicks on one of the field type filter buttons
export function handleButtonClick(fieldFinderDropdown: FieldFinderDropdown, button:HTMLButtonElement) {
    fieldFinderDropdown.toggleFieldTypeFilter(button);
}

// Handle when user clicks on field selector
export function handleFieldSelectorClick(fieldFinderDropdown: FieldFinderDropdown) {
    if (!fieldFinderDropdown.nsDropdown.div?.fieldFinderLoaded)
        fieldFinderDropdown.softReload();
    if (!fieldFinderDropdown.nsDropdown.getIndex())
        fieldFinderDropdown.reset();
    fieldFinderDropdown.setFocusOnTextBox();
}

export function handleMultiSelectClick(fieldFinderDropdown: FieldFinderDropdown, fieldId:string) {
    fieldFinderDropdown.selectField(fieldId);
}

export function handleKey(key: string, eventType: string, fieldFinderDropdown: FieldFinderDropdown) {
    if (eventType == 'keyup' && key == 'Enter' || key == 'Tab') {
        fieldFinderDropdown.handleEnterOrTabKey();
    }
    else if (eventType == 'keyup' && ((key.length==1 && key.match(/[a-zA-Z0-9]/)) || key == 'Backspace')) {
        fieldFinderDropdown.handleAlphaNumericKey();
    }
    else if (eventType == 'keydown' && (key == 'ArrowDown' || key == 'ArrowUp')) {
        fieldFinderDropdown.handleArrowKey(key);
    }
}

// Expands related table so that all fields are available in same
export async function handleRelatedTableClick(fieldFinderDropdown:FieldFinderDropdown,tableId:string) {
    await fieldFinderDropdown.addRelatedTableFields(tableId);
}

// If a field is added using native NetSuite functionality, we need to refresh selected fields
export function handleFieldUpdate(machine:any) {
    const dropdown = machine.layoutdd;
    const fieldFinderDropdown = dropdown.fieldFinder as FieldFinderDropdown;
    if (!fieldFinderDropdown) return;
    fieldFinderDropdown.refreshMultiSelectOptions();
}