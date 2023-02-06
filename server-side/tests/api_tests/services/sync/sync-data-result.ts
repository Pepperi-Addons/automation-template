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
}