import config from '../../../../../../addon.config.json';

export class SyncDataResult {
    data: any;
    private addonUUID = '02754342-e0b5-4300-b728-a94ea5e0e8f4'

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
            return resource.MetaData[0].ExternalID.replace('CPI_Data_'+this.addonUUID+'_','')
        })
        return schemes
    }

    getObjectsFromWACD(schemaName: string): any[] {
        return this.data.ResourcesData.find(resource => resource.MetaData[0].ExternalID.replace('CPI_Data_'+this.addonUUID+'_','') == schemaName).Data;
    }
    
}