import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ResourceManagerService } from '../../resource_management/resource_manager.service';

export class SyncDimxService{
    private addonUUID = '02754342-e0b5-4300-b728-a94ea5e0e8f4'

    async createRelation(schemaName:string, papiClient:PapiClient){
        const resourcaManager = new ResourceManagerService(papiClient,this.addonUUID)
        let relation = {
            RelationName: "DataImportResource",
            AddonUUID: this.addonUUID,
            Name: schemaName,
            Description: "Sync Test Import Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/import_relation_function"
        }
        try{
            await resourcaManager.createRelation(relation)
        }
        catch(err){
            throw new Error('There was an error creating dimx relation ' + err)
        }
    }

    async uploadDataToDIMX(bodyToUpload:any,schemaName:string,papiClient:PapiClient) : Promise<any>{
        const ansFromImport = await papiClient.addons.data.import.uuid(this.addonUUID).table(schemaName).upsert(bodyToUpload)
        console.log(ansFromImport)
        return ansFromImport
    }

}