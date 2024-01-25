export const MockHtmlResponse = (dataFieldName:string) => `
<html>
<head></head>
<body>
<div data-name="${dataFieldName}" data-options="[{&quot;value&quot;:&quot;&quot;,&quot;text&quot;:&quot;&quot;},{&quot;value&quot;:&quot;SN_SystemNote_CONTEXT&quot;,&quot;text&quot;:&quot;Context&quot;},{&quot;value&quot;:&quot;SN_SystemNote_DATE&quot;,&quot;text&quot;:&quot;Date&quot;},{&quot;value&quot;:&quot;SN_SystemNote_FIELD&quot;,&quot;text&quot;:&quot;Field&quot;},{&quot;value&quot;:&quot;SN_SystemNote_NEWVALUE&quot;,&quot;text&quot;:&quot;New Value&quot;},{&quot;value&quot;:&quot;SN_SystemNote_OLDVALUE&quot;,&quot;text&quot;:&quot;Old Value&quot;},{&quot;value&quot;:&quot;SN_SystemNote_RECORD&quot;,&quot;text&quot;:&quot;Record&quot;},{&quot;value&quot;:&quot;SN_SystemNote_RECORDID&quot;,&quot;text&quot;:&quot;Record ID&quot;},{&quot;value&quot;:&quot;SN_SystemNote_RECORDTYPE&quot;,&quot;text&quot;:&quot;Record Type&quot;},{&quot;value&quot;:&quot;SN_SystemNote_ROLE&quot;,&quot;text&quot;:&quot;Role&quot;},{&quot;value&quot;:&quot;SN_SystemNote_NAME&quot;,&quot;text&quot;:&quot;Set by&quot;},{&quot;value&quot;:&quot;SN_SystemNote_TYPE&quot;,&quot;text&quot;:&quot;Type&quot;}]">
<form>
<input name="joinlabel" id="joinlabel" type="hidden" value="System Notes">
</form>
</div>
</body>
</html>
`;

export const MockHtmlResponse2 = (dataFieldName:string) => `
<html>
<head></head>
<body>
<div data-name="${dataFieldName}" data-options="[{&quot;value&quot;:&quot;&quot;,&quot;text&quot;:&quot;&quot;},{&quot;value&quot;:&quot;ME_Message_AUTHOR&quot;,&quot;text&quot;:&quot;Author&quot;},{&quot;value&quot;:&quot;ME_Message_BCC&quot;,&quot;text&quot;:&quot;Bcc&quot;},{&quot;value&quot;:&quot;ME_Message_CC&quot;,&quot;text&quot;:&quot;Cc&quot;},{&quot;value&quot;:&quot;ME_Message_MESSAGEDATE&quot;,&quot;text&quot;:&quot;Date&quot;},{&quot;value&quot;:&quot;ME_Message_EXTERNALID&quot;,&quot;text&quot;:&quot;External ID&quot;},{&quot;value&quot;:&quot;ME_Message_EXTERNALIDSTRING&quot;,&quot;text&quot;:&quot;External ID (Text)&quot;},{&quot;value&quot;:&quot;ME_Message_AUTHOREMAIL&quot;,&quot;text&quot;:&quot;From Email&quot;},{&quot;value&quot;:&quot;ME_Message_HASATTACHMENT&quot;,&quot;text&quot;:&quot;Has Attachment&quot;},{&quot;value&quot;:&quot;ME_Message_INTERNALID&quot;,&quot;text&quot;:&quot;Internal ID&quot;},{&quot;value&quot;:&quot;ME_Message_INTERNALIDNUMBER&quot;,&quot;text&quot;:&quot;Internal ID (Number)&quot;},{&quot;value&quot;:&quot;ME_Message_ISINCOMING&quot;,&quot;text&quot;:&quot;Is Incoming&quot;},{&quot;value&quot;:&quot;ME_Message_MESSAGE&quot;,&quot;text&quot;:&quot;Message&quot;},{&quot;value&quot;:&quot;ME_Message_RECIPIENT&quot;,&quot;text&quot;:&quot;Primary Recipient&quot;},{&quot;value&quot;:&quot;ME_Message_RECIPIENTS&quot;,&quot;text&quot;:&quot;Recipients&quot;},{&quot;value&quot;:&quot;ME_Message_SUBJECT&quot;,&quot;text&quot;:&quot;Subject&quot;},{&quot;value&quot;:&quot;ME_Message_RECIPIENTEMAIL&quot;,&quot;text&quot;:&quot;To&quot;},{&quot;value&quot;:&quot;ME_Message_MESSAGETYPE&quot;,&quot;text&quot;:&quot;Type&quot;}]">
<form>
<input name="joinlabel" id="joinlabel" type="hidden" value="Messages">
</form>
</div>
</body>
</html>
`;


export class MockNsMachine {
    name: string;
    index: number;
    layoutdd: any;
    postBuildTableListeners: [];
    constructor(machineName:string) {
      this.name = machineName;
      this.index = 0;
      this.postBuildTableListeners = [];
    }
    dataManager = {
      lineArray: [] as string[][],
      getLineArray() {
        return this.lineArray
      },
      findFieldValueLineNum(machineName:string, fieldId:string) {
        var lineArr = this.getLineArray();
        return lineArr.findIndex((element) => element[0] == fieldId);
      },
      deleteLine(index:number) {
        this.lineArray.splice(index,1);
      },
      insertLine(line:string[],insertLocation:number) {
        this.lineArray.push(line);
      }
    };
    deleteline(indexOfField:number) {
      this.dataManager.deleteLine(indexOfField);
    }
    getLineCount() {
      this.dataManager.getLineArray().length;
    }
    setMachineIndex(index:number) {
      this.index = index;
    }
    clearline() {
      return true;
    }
    buildtable() {
      return true;
    }
    insertLine(line:string[],insertLocation:number) {
      this.dataManager.insertLine(line,insertLocation);
    }
    incrementIndex() {
      this.index++;
    }
};

export class MockCurrentCell {
    constructor() {
    }
    scrollIntoView(scroll:boolean) {
      return true;
    }
}
  
export class MockNSDropdown {
    div: HTMLDivElement;
    inpt: HTMLInputElement;
    indexOnDeck: number;
    hddn: any;
    valueToIndexMap: any;
    valueArray: string[];
    textArray: string[];
    divArray: HTMLDivElement[];
    fieldFinder: any;
    currentCell: MockCurrentCell;
    name: string;
    constructor(name:string) {
      this.div = document.createElement('div');
      this.inpt = document.createElement('input');
      this.indexOnDeck = 0;
      this.currentCell = new MockCurrentCell();
      this.hddn = {};
      this.valueArray = [];
      this.valueToIndexMap = {};
      this.textArray = [];
      this.divArray = [];
      this.name = name;
    }
    setAndClose(cell:any) {
      return true;
    }
    respondToArrow(numberOfOptionsToMove: number) {
      this.indexOnDeck = this.indexOnDeck+numberOfOptionsToMove;
      return true;
    }
    getIndex() {
      return this.indexOnDeck;
    }
    getIndexForValue(val:string) {
      return this.valueToIndexMap[val];
    }
    close() {
      return true;
    }
    open() {
      return true;
    }
    setCurrentCellInMenu(cell:number) {
      return true;
    }
    scrollIntoView(scroll:boolean) {
      return true;
    }
    addOption(optionText:string,optionId:string,location:number) {
      const nsDropdownOpt = document.createElement('div');
      nsDropdownOpt.textContent = optionText;
      this.div.appendChild(nsDropdownOpt);
      this.valueArray.splice(location, 0, optionId);
      this.textArray.splice(location,0,optionText);
      this.valueToIndexMap = [];
      for (var index in this.valueArray) {
        this.valueToIndexMap[this.valueArray[index]] = index;
      }
    }
    buildDiv() {
      return true;
    }
}

export class MockNSCore {
  constructor() {
  }
  Core = {
    getURLParameter(queryString:string) {
      return false;
    }
  }
}

type FieldDefinition = {
  fieldId: string,
  fieldName: string
}

