import config from '../../../../../addon.config.json';

export class SyncDataResult {
    data: any;

    async getSchemes() {
        let schemesArray = this.data.ResourcesData.map(resource =>{
            if(resource.Schema.AddonUUID == config.AddonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }

    getFieldBySchemaName(schemaName:string){
        return this.data.ResourcesData.find(resource => resource.Schema.Name == schemaName).Objects
    }

    getFields(schemaNames:any):FieldsData{
        let fields:FieldsData = {
            account: [],
            user: [],
            none: []
        }
        fields.account = this.data.ResourcesData.find(resource => resource.Schema.Name == schemaNames.account).Objects
        fields.user = this.data.ResourcesData.find(resource => resource.Schema.Name == schemaNames.user).Objects
        fields.none = this.data.ResourcesData.find(resource => resource.Schema.Name == schemaNames.none).Objects
        return fields
    }
}

export interface FieldsData{
    account:any[];
    user:any[];
    none:any[];
}