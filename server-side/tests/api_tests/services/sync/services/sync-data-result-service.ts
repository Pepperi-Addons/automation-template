import config from '../../../../../../addon.config.json';

export class SyncDataResult {
    data: any;

    getResourcesContentLength(){
        return this.data.Resources.ContentLength
    }
    async getSchemes() {
        let schemesArray = this.data.Resources.Data.map(resource =>{
            if(resource.Schema.AddonUUID == config.AddonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }

    getObjects(schemaName: string): any[] {
        let objects =  this.data.Resources.Data.filter(resource => {
            return resource.Schema.Name == schemaName
        })
        let data = objects.map(obj=> obj.Objects)
        return [].concat(...data);
    }

    getSchemesFromWACD(){
        let schemes = this.data.Resources.Data.map(resource =>{
            return resource.MetaData[0].ExternalID.replace('CPI_Data_' + config.AddonUUID + '_', '')
        })
        return schemes
    }

    getObjectsFromWACD(schemaName: string): any[] {
        return this.data.Resources.Data.find(resource => resource.MetaData[0].ExternalID.replace('CPI_Data_' + config.AddonUUID + '_', '') == schemaName).Data;
    }

    getFile(fileURL){
        if(this.data?.Files?.Data){
            const file = this.data.Files.Data.filter(file =>{
                return file.URL == fileURL
            })
            return file[0]
        }
        else{
            return []
        }
    }

    getFileDownload(fileURL: string){
        return this.data.Files.Data.find(file => file.URL == fileURL).DownloadToWebApp;
    }
    
}