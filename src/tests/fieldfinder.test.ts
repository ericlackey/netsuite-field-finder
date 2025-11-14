import { relatedTableDataIds } from "../constants";
import {
  handleButtonClick,
  handleFieldSelectorClick,
  handleFieldUpdate,
  handleKey,
  handleMultiSelectClick,
  handleRelatedTableClick,
  FieldFinderDropdown,
  FieldType
} from "../dropdown";
import { initializeFieldFinder } from "../fieldfinder";
import { MockNSDropdown, MockNsMachine, MockNSCore, MockHtmlResponse, MockHtmlResponse2 } from "./__mocks__/netsuite";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();

declare global {
  var currentDropdown: any; // NetSuite variable that represents active dropdown
  var NS: MockNSCore;
  var machines: any;
  var dropdowns: any;
  var fieldFinderVersion: string;
  var setRfType:Function;
}

global.NS = new MockNSCore();
global.fieldFinderVersion = "0.01";
global.setRfType = () => {
  return true;
}

/* Create FieldFinder config */
const ffSettingsDefault:FieldFinderSettings = {
  enabled: true,
  features: {
    relatedTableExpansion: true,
    multiSelect: true
  },
  attributes: {
    fieldId: true,
    fieldType: true,
    dataType: true
  }
};

var ffSettingsWithRelatedTableExpansionDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithRelatedTableExpansionDisabled.features.relatedTableExpansion = false;

var ffSettingsWithMultiSelectDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithMultiSelectDisabled.features.multiSelect = false;

var ffSettingsWithAllFeaturesDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithAllFeaturesDisabled.features.multiSelect = false;
ffSettingsWithAllFeaturesDisabled.features.relatedTableExpansion = false;

var ffSettingsWithFieldIdAttributeDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithFieldIdAttributeDisabled.attributes.fieldId = false;

var ffSettingsWithFieldTypeAttributeDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithFieldTypeAttributeDisabled.attributes.fieldType = false;

var ffSettingsWithDataTypeAttributeDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithDataTypeAttributeDisabled.attributes.dataType = false;

var ffSettingsWithDataTypeAndFieldIdAttributeDisabled = JSON.parse(JSON.stringify(ffSettingsDefault));
ffSettingsWithDataTypeAndFieldIdAttributeDisabled.attributes.dataType = false;
ffSettingsWithDataTypeAndFieldIdAttributeDisabled.attributes.fieldId = false;

var featureSettings:any = {};
featureSettings['Default'] = ffSettingsDefault;
featureSettings['RelatedTableExpansionDisabled'] = ffSettingsWithRelatedTableExpansionDisabled;
featureSettings['MultiSelectDisabled'] = ffSettingsWithMultiSelectDisabled;
featureSettings['AllFeaturesDisabled'] = ffSettingsWithAllFeaturesDisabled;
featureSettings['FieldIdDisabled'] = ffSettingsWithFieldIdAttributeDisabled;
featureSettings['FieldTypeDisabled'] = ffSettingsWithFieldTypeAttributeDisabled;
featureSettings['DataTypeDisabled'] = ffSettingsWithDataTypeAttributeDisabled;
featureSettings['DataTypeAndFieldIdDisabled'] = ffSettingsWithDataTypeAndFieldIdAttributeDisabled;

const inputSettings = document.createElement('input');
inputSettings.setAttribute('id','field-finder-settings');
inputSettings.setAttribute('data-options',JSON.stringify(ffSettingsDefault));

const searchType = document.createElement('input');
searchType.setAttribute('id','searchtype');
searchType.value = "transaction";
const recType = document.createElement('input');
recType.setAttribute('id','rectype');
recType.value = "-1";
document.body.appendChild(inputSettings);
document.body.appendChild(searchType);
document.body.appendChild(recType);

var fieldFinder: FieldFinderDropdown;

const mockStandardFields = [
  {fieldId: 'stdentityfield', fieldName:'Standard Field Name'},
  {fieldId: 'stdbodyfield', fieldName:'Standard Body Field Name'}
];

const mockCustomFields = [
  {fieldId: 'custbody_amountfield', fieldName:'Custom Body Field Name'},
  {fieldId: 'custcol_field', fieldName:'Custom Column Field Name'},
  {fieldId: 'custrecord_field', fieldName:'Custom Record Field'},
  {fieldId: 'custom_field', fieldName:'Custom Field Name'}
];

const mockRelatedFields = [
  {fieldId: 'rel', fieldName:'Some Fields...'},
  {fieldId: 'tbl', fieldName:'Some Other Fields...'}
];

const mockReturnFieldsDropdown = () => {
  let dropdown = new MockNSDropdown("rffield");
  dropdown.addOption(mockStandardFields[0].fieldName,mockStandardFields[0].fieldId,0);
  dropdown.addOption(mockStandardFields[1].fieldName,mockStandardFields[1].fieldId,1);
  dropdown.addOption(mockCustomFields[0].fieldName,mockCustomFields[0].fieldId,2);
  dropdown.addOption(mockCustomFields[1].fieldName,mockCustomFields[1].fieldId,3);
  dropdown.addOption(mockCustomFields[2].fieldName,mockCustomFields[2].fieldId,4);
  dropdown.addOption(mockCustomFields[3].fieldName,mockCustomFields[3].fieldId,5);
  dropdown.addOption(mockRelatedFields[0].fieldName,mockRelatedFields[0].fieldId,6);
  dropdown.addOption(mockRelatedFields[1].fieldName,mockRelatedFields[1].fieldId,7);
  const machine = new MockNsMachine("returnfields");
  machine.layoutdd = dropdown;
  dropdown.hddn.machine = machine;
  return dropdown;
};

const mockFilterFieldsDropdown = () => {
  let dropdown = new MockNSDropdown("filterfilter");
  dropdown.addOption(mockStandardFields[0].fieldName,mockStandardFields[0].fieldId,0);
  dropdown.addOption(mockStandardFields[1].fieldName,mockStandardFields[1].fieldId,1);
  dropdown.addOption(mockCustomFields[0].fieldName,mockCustomFields[0].fieldId,2);
  dropdown.addOption(mockCustomFields[1].fieldName,mockCustomFields[1].fieldId,3);
  dropdown.addOption(mockCustomFields[2].fieldName,mockCustomFields[2].fieldId,4);
  dropdown.addOption(mockCustomFields[3].fieldName,mockCustomFields[3].fieldId,5);
  dropdown.addOption(mockRelatedFields[0].fieldName,mockRelatedFields[0].fieldId,6);
  dropdown.addOption(mockRelatedFields[1].fieldName,mockRelatedFields[1].fieldId,7);
  const machine = new MockNsMachine("filters");
  machine.layoutdd = dropdown;
  dropdown.hddn.machine = machine;
  return dropdown;
};

const mockSortFieldsDropdown = () => {
  let dropdown = new MockNSDropdown("sort1");
  dropdown.addOption(mockStandardFields[0].fieldName,mockStandardFields[0].fieldId,0);
  dropdown.addOption(mockStandardFields[1].fieldName,mockStandardFields[1].fieldId,1);
  dropdown.addOption(mockCustomFields[0].fieldName,mockCustomFields[0].fieldId,2);
  dropdown.addOption(mockCustomFields[1].fieldName,mockCustomFields[1].fieldId,3);
  dropdown.addOption(mockCustomFields[2].fieldName,mockCustomFields[2].fieldId,4);
  dropdown.addOption(mockCustomFields[3].fieldName,mockCustomFields[3].fieldId,5);
  return dropdown;
};


var testDropdowns = [
  ["rffield","Default"],
  ["filterfilter","Default"],
  ["sort1","Default"],
  ["rffield","RelatedTableExpansionDisabled"],
  ["filterfilter","RelatedTableExpansionDisabled"],
  ["sort1","RelatedTableExpansionDisabled"],
  ["rffield","MultiSelectDisabled"],
  ["filterfilter","MultiSelectDisabled"],
  ["sort1","MultiSelectDisabled"],
  ["rffield","AllFeaturesDisabled"],
  ["filterfilter","AllFeaturesDisabled"],
  ["sort1","AllFeaturesDisabled"],
  ["rffield","FieldIdDisabled"],
  ["filterfilter","FieldIdDisabled"],
  ["sort1","FieldIdDisabled"],
  ["rffield","FieldTypeDisabled"],
  ["filterfilter","FieldTypeDisabled"],
  ["sort1","FieldTypeDisabled"],
  ["rffield","DataTypeDisabled"],
  ["filterfilter","DataTypeDisabled"],
  ["sort1","DataTypeDisabled"],
  ["rffield","DataTypeAndFieldIdDisabled"],
  ["filterfilter","DataTypeAndFieldIdDisabled"],
  ["sort1","DataTypeAndFieldIdDisabled"],
];

describe.each(testDropdowns)("Test Field Finder %s with features %s", (dropdownKey:string, featureSettingsKey:string) => {

    fieldFinder: FieldFinderDropdown;

    var button;
   
    test(`Initialize Field Finder`, () => {
      global.dropdowns = {};
      global.machines = {};

      // Create mock objects to test
      const theReturnFieldsDropdown = mockReturnFieldsDropdown();
      machines[theReturnFieldsDropdown.hddn.machine.name] = theReturnFieldsDropdown.hddn.machine;
      dropdowns[theReturnFieldsDropdown.name] = theReturnFieldsDropdown;

      const theFilterFieldsDropdown = mockFilterFieldsDropdown();
      machines[theFilterFieldsDropdown.hddn.machine.name] = theFilterFieldsDropdown.hddn.machine;
      dropdowns[theFilterFieldsDropdown.name] = theFilterFieldsDropdown;

      const theSortFieldsDropdown = mockSortFieldsDropdown();
      dropdowns[theSortFieldsDropdown.name] = theSortFieldsDropdown;

      inputSettings.setAttribute('data-options',JSON.stringify(featureSettings[featureSettingsKey]));
      initializeFieldFinder();
      fieldFinder = dropdowns[dropdownKey].fieldFinder;
    });

    test("Number of field finder options matches dropdown options", () => {
      expect (fieldFinder.options.length).toBe(fieldFinder.nsDropdown.valueArray.length);
    });

    test("Test standard button click", () => {
      button = fieldFinder.buttons.standard;
      expect(button).toBeDefined;
      if (button) {
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe("ff_btn_enabled");
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(true);
        expect (fieldFinder.fieldsDisplayed).toBe(3);  
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe(undefined);
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(false);
        expect (fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
      }
    });

    test("Test custom button click", () => {
      button = fieldFinder.buttons.custom;
      expect(button).toBeDefined;
      if (button) {
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe("ff_btn_enabled");
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(true);
        expect (fieldFinder.fieldsDisplayed).toBe(3);  
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe(undefined);
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(false);
        expect (fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
      }
    });

    test("Test related button click", () => {
      button = fieldFinder.buttons.related;
      expect(button).toBeDefined;
      if (button) {
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe("ff_btn_enabled");
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(true);
        expect (fieldFinder.fieldsDisplayed).toBe(2);
        handleButtonClick(fieldFinder, button);
        expect (button.classList[0]).toBe(undefined);
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(false);
        expect (fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
      }
    });

    test("Test mixed button clicks", () => {
      button = fieldFinder.buttons.related;
      var button2 = fieldFinder.buttons.standard;
      expect(button).toBeDefined;
      expect(button2).toBeDefined;
      if (button && button2) {
        fieldFinder.toggleFieldTypeFilter(button);
        fieldFinder.toggleFieldTypeFilter(button2);
        expect (button.classList[0]).toBe("ff_btn_enabled");
        expect (button2.classList[0]).toBe("ff_btn_enabled");
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(true);
        expect (fieldFinder.fieldTypeStatus[button2.id as keyof FieldTypeStatus]).toBe(true);
        expect (fieldFinder.fieldsDisplayed).toBe(5);  
        fieldFinder.toggleFieldTypeFilter(button);
        fieldFinder.toggleFieldTypeFilter(button2);
        expect (button.classList[0]).toBe(undefined);
        expect (button2.classList[0]).toBe(undefined);
        expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(false);
        expect (fieldFinder.fieldTypeStatus[button2.id as keyof FieldTypeStatus]).toBe(false);
        expect (fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
      }
    });

    test("Test field types", () => {
      expect(fieldFinder.standardOptions[0].getFieldType()).toBe(FieldType.STANDARD);
      if (fieldFinder.hasCustomFields)
        expect(fieldFinder.customOptions[0].getFieldType()).toContain("Custom");
      if (fieldFinder.hasRelatedTableFields)
        expect(fieldFinder.relatedOptions[0].getFieldType()).toBe(FieldType.RELATED);
    });

    test("Test select option", () => {
      var multiSelectElement = fieldFinder.options[2].element.childNodes[0] as HTMLSpanElement;
      if (fieldFinder.multiSelect) {
        fieldFinder.options[2].select();
        expect(multiSelectElement.classList[2]).toBe("ff_multiedit_selected");
      } else {
        expect(multiSelectElement.classList[2]).toBe(undefined);
      }
    });

    test("Test unselect option", () => {
      fieldFinder.options[2].unselect();
      var multiSelectElement = fieldFinder.options[2].element.childNodes[0] as HTMLSpanElement;
      expect(multiSelectElement.classList[2]).toBe(undefined);
    });

    test("Test pretty field id", () => {
      expect(fieldFinder.standardOptions[0].prettyFieldId()).toBe("field");
    });

    test("Test soft reload", () => {
      fieldFinder.softReload();
      expect(fieldFinder.options.length).toBe(fieldFinder.options.length);
    });

    test("Test reset", () => {
      fieldFinder.reset();
      expect(fieldFinder.fieldTypeStatus.customFields).toBe(false);
      expect(fieldFinder.fieldTypeStatus.standardFields).toBe(false);
      expect(fieldFinder.fieldTypeStatus.relatedTableFields).toBe(false);
      expect(fieldFinder.searchInputField.value).toBe("");
    });

    test("Test refresh multiselect", () => {
      if (fieldFinder.multiSelect) {
        handleMultiSelectClick(fieldFinder,'custbody_amountfield');
        handleMultiSelectClick(fieldFinder,'custcol_field');
        fieldFinder.refreshMultiSelectOptions();
        expect(fieldFinder.selectedOptions[0].fieldId).toBe('custbody_amountfield');
        expect(fieldFinder.selectedOptions[1].fieldId).toBe('custcol_field');
        handleMultiSelectClick(fieldFinder,'custbody_amountfield');
        fieldFinder.refreshMultiSelectOptions();
        expect(fieldFinder.selectedOptions.length).toBe(1);
        handleMultiSelectClick(fieldFinder,'custcol_field');
        fieldFinder.refreshMultiSelectOptions();
        expect(fieldFinder.selectedOptions.length).toBe(0);
      }
    });

    test("Test getting a related table URL", () => {
      expect(fieldFinder.relatedTableUrl("filters","tst")).toBe("/app/common/search/search.nl?join=tst&searchtype=transaction&ifrmcntnr=T&rectype=-1");
    });

    test("Test inserting a line into the machine",() => {
      if (fieldFinder.hasMachine) {
        expect(fieldFinder.selectedOptions.length).toBe(0);
        fieldFinder.nsDropdown.hddn.machine.insertLine(['custrecord_field','','','','','',''],0);
        handleFieldUpdate(fieldFinder.nsDropdown.hddn.machine);
        expect(fieldFinder.selectedOptions.length).toBe(1);  
      }
    });

    test("Test search input", () => {
      fieldFinder.searchInputField.value = "Standard";
      fieldFinder.handleAlphaNumericKey();
      expect(fieldFinder.fieldsDisplayed).toBe(2);
      fieldFinder.searchInputField.value = "";
      fieldFinder.handleAlphaNumericKey();
      expect(fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
      fieldFinder.searchInputField.value = "";
      fieldFinder.handleAlphaNumericKey();
    });

    test("Test arrow keys", () => {
      fieldFinder.searchInputField.value = "sta";
      handleKey('s','keyup',fieldFinder);
      handleKey('t','keyup',fieldFinder);
      handleKey('a','keyup',fieldFinder);
      expect(fieldFinder.fieldsDisplayed).toBe(2);
      handleKey('ArrowDown','keydown',fieldFinder);
      handleKey('ArrowDown','keydown',fieldFinder);
      expect(fieldFinder.nsDropdown.indexOnDeck).toBe(1);
      handleKey('ArrowUp','keydown',fieldFinder);
      handleKey('ArrowUp','keydown',fieldFinder);
      handleKey('ArrowUp','keydown',fieldFinder);
      expect(fieldFinder.nsDropdown.indexOnDeck).toBe(0);
    });
  
    test("Test enter key", () => {
      handleKey('Enter','keyup',fieldFinder);
    });

    test("Test backspace key", () => {
      handleKey('Backspace','keyup',fieldFinder);
    });
  
    test("Test the handler that handles clicking of a field selector", () => {
      global.currentDropdown = fieldFinder.nsDropdown;
      handleFieldSelectorClick(fieldFinder);
    });

    test("Test add related table", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('rel')) {
        fetchMock.mockResponseOnce(MockHtmlResponse(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]));
        fieldFinder.addRelatedTableFields('rel').then(result => {
          expect(result).toBe(true);
          expect(fieldFinder.options.length).toBe(19);
        });  
      }
    });

    test("Test add same related table which should result in error", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('rel')) {
        fieldFinder.addRelatedTableFields('rel').then(result => {
          expect(result).toBe(false);
        });
      }
    });

    test("Test add table that does not exist", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('rel2')) {
        fieldFinder.addRelatedTableFields('rel2').then(result => {
          expect(result).toBe(false);
        });
      }
    });

    test("Test add new related table which should result in failure", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('tbl')) {
        fieldFinder.addRelatedTableFields('tbl').then(result => {
          expect(result).toBe(false);
        });
      }
    });

    test("Test add new related table which should return non 200", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('rel2')) {
        fetchMock.mockResponseOnce(MockHtmlResponse(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]), {
          status: 500
        });
        fieldFinder.addRelatedTableFields('tbl').then(result => {
          expect(result).toBe(false);
        });
      }
    });

    test("Test add related table through event handler", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('tbl')) {
        fetchMock.mockResponseOnce(MockHtmlResponse2(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]));
        handleRelatedTableClick(fieldFinder,'tbl').then(() => {
          expect(fieldFinder.options.length).toBe(36);
        });
      }
    });

    test("Make sure field id is not showing if Field ID attribute is disabled", () => {
      if (fieldFinder.settings.attributes.fieldId)
        expect(fieldFinder.options[0].fieldIdElement.parentElement).toBeDefined;
      else
        expect(fieldFinder.options[0].fieldIdElement.parentElement).toBeUndefined;
    });

    test("Make sure data type is not showing if Data Type attribute is disabled", () => {
      if (fieldFinder.settings.attributes.dataType)
        expect(fieldFinder.options[0].dataTypeElement.parentElement).toBeDefined;
      else
        expect(fieldFinder.options[0].fieldIdElement.parentElement).toBeUndefined;
    });

    test("Make sure field type is not showing if Field Type attribute is disabled", () => {
      if (fieldFinder.settings.attributes.fieldType)
        expect(fieldFinder.options[0].fieldTypeElement.parentElement).toBeDefined;
      else
        expect(fieldFinder.options[0].fieldIdElement.parentElement).toBeUndefined;
    });

    test("Make sure dropdown width is correct", () => {
      let fieldTypeEnabled = fieldFinder.settings.attributes.fieldType;
      let fieldIdEnabled = fieldFinder.settings.attributes.fieldId;
      let dataTypeEnabled = fieldFinder.settings.attributes.dataType;
      if (!fieldTypeEnabled && fieldIdEnabled && dataTypeEnabled) {
        expect(fieldFinder.nsDropdown.div.style.getPropertyValue('width')).toBe("688px");
      }
      else if (fieldTypeEnabled && !fieldIdEnabled && dataTypeEnabled) {
        expect(fieldFinder.nsDropdown.div.style.getPropertyValue('width')).toBe("520px");
      }
      else if (fieldTypeEnabled && fieldIdEnabled && !dataTypeEnabled) {
        expect(fieldFinder.nsDropdown.div.style.getPropertyValue('width')).toBe("720px");
      }
      else if (fieldTypeEnabled && !fieldIdEnabled && !dataTypeEnabled) {
        expect(fieldFinder.nsDropdown.div.style.getPropertyValue('width')).toBe("450px");
      }
      else {
        expect(fieldFinder.nsDropdown.div.style.getPropertyValue('width')).toBe("800px");
      }
    });

});

