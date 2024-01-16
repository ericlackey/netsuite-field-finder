type FieldFinderSettings = {
    enabled: boolean;
    features: {
        multiSelect: boolean,
        relatedTableExpansion: boolean
    },
    attributes: {
        fieldId: boolean,
        fieldType: boolean,
        dataType: boolean
    }
};

type FieldTypeStatus = {
    standardFields: boolean,
    customFields: boolean,
    relatedTableFields: boolean
}

type RelatedTableUrls = {
    filters: string,
    returnfields: string,
    summaryfilters: string, 
    field: string,
    detailfields: string,
    filterfields: string
};

