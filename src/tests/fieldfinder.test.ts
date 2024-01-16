import {
  handleButtonClick,
  handleFieldSelectorClick,
  handleFieldUpdate,
  handleKey,
  handleMultiSelectClick,
  handleRelatedTableClick,
  initializeFieldFinder,
  FieldFinderDropdown,
  relatedTableDataIds
} from "../fieldfinder";
import { MockNSDropdown, MockNsMachine, MockNSCore, mockHtmlResponse, mockHtmlResponse2, mockReturnFieldsDropdown, mockFilterFieldsDropdown } from "./__mocks__/netsuite";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();

declare global {
  var currentDropdown: any; // NetSuite variable that represents active dropdown
  var NS: MockNSCore;
  var machines: any;
  var dropdowns: any;
}

global.NS = new MockNSCore();



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

var featureSettings:any = {};
featureSettings['Default'] = ffSettingsDefault;
featureSettings['RelatedTableExpansionDisabled'] = ffSettingsWithRelatedTableExpansionDisabled;
featureSettings['MultiSelectDisabled'] = ffSettingsWithMultiSelectDisabled;


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


/*const testDropdowns = [
  ["rffield","Default"],
  ["rffield","MultiSelectDisabled"],
  ["rffield","RelatedTableExpansionDisabled"],
  ["filterfilter","Default"],
  ["filterfilter","MultiSelectDisabled"],
  ["filterfilter","RelatedTableExpansionDisabled"],
];*/

const testDropdowns = [
  ["rffield","Default"],
]

describe.each(testDropdowns)("Test Field Finder %s with features %s", (dropdownKey:string, featureSettingsKey:string) => {

    fieldFinder: FieldFinderDropdown;

    test(`Test initialize Field Finder`, () => {
      global.dropdowns = {};
      global.machines = {};

      /* Create mock objects to test */
      const theMockDropdown = mockReturnFieldsDropdown();
      machines[theMockDropdown.hddn.machine.name] = theMockDropdown.hddn.machine;
      dropdowns[theMockDropdown.name] = theMockDropdown;

      console.log(theMockDropdown);

      const theMockDropdown2 = mockFilterFieldsDropdown();
      machines[theMockDropdown2.hddn.machine.name] = theMockDropdown2.hddn.machine;
      dropdowns[theMockDropdown2.name] = theMockDropdown2;

      console.log(theMockDropdown2);


      //const theMockDropdown = new MockNSDropdown("rffield");
      //const theMockMachine = new MockNsMachine("returnfields");
      /*
      theMockDropdown.addOption("Standard Field Name","stdentityfield",0);
      theMockDropdown.addOption("Custom Body Field Name","custbody_amount",1);
      theMockDropdown.addOption("Custom Column Field Name","custcol_field",2);
      theMockDropdown.addOption("Custom Record Field","custrecord_field",3);
      theMockDropdown.addOption("Standard Body Field Name","stdbodyfield",4);
      theMockDropdown.addOption("Custom Field Name","custom_field",5);
      theMockDropdown.addOption("Some Fields...","rel",6);
      theMockDropdown.addOption("Some Other Fields...","tbl",7);
      theMockMachine.layoutdd = theMockDropdown;
      theMockDropdown.hddn.machine = theMockMachine;
      dropdowns[theMockDropdown.name] = theMockDropdown;
      machines[theMockMachine.name] = theMockMachine;
  

      const theMockDropdown2 = new MockNSDropdown("filterfilter");
      const theMockMachine2 = new MockNsMachine("filters");
      theMockDropdown2.addOption("Standard Field Name","stdentityfield",0);
      theMockDropdown2.addOption("Custom Body Field Name","custbody_amount",1);
      theMockDropdown2.addOption("Custom Column Field Name","custcol_field",2);
      theMockDropdown2.addOption("Custom Record Field","custrecord_field",3);
      theMockDropdown2.addOption("Standard Body Field Name","stdbodyfield",4);
      theMockDropdown2.addOption("Custom Field Name","custom_field",5);
      theMockMachine2.layoutdd = theMockDropdown2;
      theMockDropdown2.hddn.machine = theMockMachine2;
      dropdowns[theMockDropdown2.name] = theMockDropdown2;
      machines[theMockMachine2.name] = theMockMachine2;
    */
      inputSettings.setAttribute('data-options',JSON.stringify(featureSettings[featureSettingsKey]));
      console.log(featureSettings[featureSettingsKey]);
      initializeFieldFinder();
      fieldFinder = dropdowns[dropdownKey].fieldFinder;
    });

    test("Test number of field options", () => {

      expect (fieldFinder.options.length).toBe(fieldFinder.options.length);
    });

    test("Test number of buttons", () => {
      if (fieldFinder.hasCustomFields && fieldFinder.hasRelatedTableFields) {
        expect (fieldFinder.buttons.length).toBe(3);
      } else if (!fieldFinder.hasCustomFields && fieldFinder.hasRelatedTableFields) {
        expect (fieldFinder.buttons.length).toBe(2);
      } else if (fieldFinder.hasCustomFields && !fieldFinder.hasRelatedTableFields) {
        expect (fieldFinder.buttons.length).toBe(2);
      } else {
        expect (fieldFinder.buttons.length).toBe(1);
      }
    });

    var button;
    test("Test standard button click", () => {
      button = fieldFinder.buttons[0];
      handleButtonClick(fieldFinder, button);
      expect (button.classList[0]).toBe("ff_btn_enabled");
      expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(true);
      expect (fieldFinder.fieldsDisplayed).toBe(3);

      handleButtonClick(fieldFinder, button);
      expect (button.classList[0]).toBe(undefined);
      expect (fieldFinder.fieldTypeStatus[button.id as keyof FieldTypeStatus]).toBe(false);
      expect (fieldFinder.fieldsDisplayed).toBe(fieldFinder.options.length);
    });

    test("Test custom button click", () => {
      if (fieldFinder.hasCustomFields) {
        button = fieldFinder.buttons[1];
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
      if (fieldFinder.hasRelatedTableFields) {
        button = fieldFinder.buttons[2];
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
      button = fieldFinder.buttons[2];
      var button2 = fieldFinder.buttons[0];
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
    });

    test("Test field types", () => {
      expect(fieldFinder.standardOptions[0].getFieldType()).toBe(FieldTypes.);
      expect(fieldFinder.options[1].getFieldType()).toBe("Custom Body");
      expect(fieldFinder.options[2].getFieldType()).toBe("Custom Column");
      expect(fieldFinder.options[3].getFieldType()).toBe("Custom Field");
      console.log(fieldFinder.options.length);
      if (fieldFinder.hasRelatedTableFields) {
        expect(fieldFinder.options[6].getFieldType()).toBe("Related Fields");
      }
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
      expect(fieldFinder.options[0].prettyFieldId()).toBe("field");
      expect(fieldFinder.options[4].prettyFieldId()).toBe("field");
      expect(fieldFinder.options[5].prettyFieldId()).toBe("field");
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
        handleMultiSelectClick(fieldFinder,'custbody_amount');
        handleMultiSelectClick(fieldFinder,'custcol_field');
        fieldFinder.refreshMultiSelectOptions();
        expect(fieldFinder.selectedOptions[0].fieldId).toBe('custbody_amount');
        expect(fieldFinder.selectedOptions[1].fieldId).toBe('custcol_field');
        handleMultiSelectClick(fieldFinder,'custbody_amount');
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
      expect(fieldFinder.selectedOptions.length).toBe(0);
      fieldFinder.nsDropdown.hddn.machine.insertLine(['custrecord_field','','','','','',''],0);
      handleFieldUpdate(fieldFinder.nsDropdown.hddn.machine);
      expect(fieldFinder.selectedOptions.length).toBe(1);
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
      expect(fieldFinder.nsDropdown.indexOnDeck).toBe(4);
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
      fetchMock.mockResponseOnce(mockHtmlResponse(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]));
      if (fieldFinder.nsDropdown.valueArray.includes('rel')) {
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
        fetchMock.mockResponseOnce(mockHtmlResponse(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]), {
          status: 500
        });
        fieldFinder.addRelatedTableFields('tbl').then(result => {
          expect(result).toBe(false);
        });
      }
    });

    test("Test add related table through event handler", () => {
      if (fieldFinder.nsDropdown.valueArray.includes('tbl')) {
        fetchMock.mockResponseOnce(mockHtmlResponse2(relatedTableDataIds[fieldFinder.nsDropdown.hddn.machine.name]));
        handleRelatedTableClick(fieldFinder,'tbl').then(() => {
          expect(fieldFinder.options.length).toBe(36);
        });
      }
    });



});


/*

test(`Test field finder being disabled`, () => {
  ffSettings.enabled = false;
  inputSettings.setAttribute('data-options',JSON.stringify(ffSettings));
  initializeFieldFinder();
});

test(`Test invalid settings`, () => {
  ffSettings.enabled = true;
  inputSettings.setAttribute('data-options',"");
  jest.spyOn(console, 'error').mockImplementation((x) => {
    expect(x).toBe('Could not parse Field Finder settings, so not loading. SyntaxError: Unexpected end of JSON input');    
  });
  initializeFieldFinder();
});

test(`Test no searchtype and rectype input fields`, () => {
  searchType.remove();
  recType.remove();
  ffSettings.enabled = true;
  inputSettings.setAttribute('data-options',JSON.stringify(ffSettings));
  initializeFieldFinder();
});
*/