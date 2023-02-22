import config from '../../../../../../addon.config.json';

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

    getObjects(schemaName: string): any[] {
        return this.data.ResourcesData.find(resource => resource.Schema.Name == schemaName).Objects;
    }

    getSchemesFromWACD(){
        let schemes = this.data.ResourcesData.map(resource =>{
            return resource.MetaData[0].ExternalID
        })
        return schemes
    }

    getObjectsFromWACD(schemaName: string): any[] {
        return this.data.ResourcesData.find(resource => resource.MetaData[0].ExternalID == schemaName).Data;
    }
    
}