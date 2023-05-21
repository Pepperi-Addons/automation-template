import config from '../../../../../../addon.config.json';

export class SyncDataResult {
    data: any;

    async getSchemes() {
        let schemesArray = this.data.Resources.Data.map(resource =>{
            if(resource.Schema.AddonUUID == config.AddonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }

    getObjects(schemaName: string): any[] {
        return this.data.Resources.Data.find(resource => resource.Schema.Name == schemaName).Objects;
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

    getFilesURLS(){
        const filesArray = this.data.Files.Data.map(file =>{
            return file.URL
        })
        return filesArray
    }

    getFileDownload(fileURL: string){
        return this.data.Files.Data.find(file => file.URL == fileURL).DownloadToWebApp;
    }
    
}