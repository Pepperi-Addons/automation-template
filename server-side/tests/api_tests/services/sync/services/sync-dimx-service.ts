import { PapiClient, Relation } from '@pepperi-addons/papi-sdk';
import { ResourceManagerService } from '../../resource_management/resource_manager.service';

export class SyncDimxService{
    private addonUUID = '02754342-e0b5-4300-b728-a94ea5e0e8f4'

    async createRelation(resourcaManager: ResourceManagerService, schemaName: string){
        let relation: Relation = {
            RelationName: "DataImportResource",
            AddonUUID: this.addonUUID,
            Name: schemaName,
            Description: "Sync Test Import Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/dimx_sync_tests/import_dimx_object_do_nothing"
        }
        try{
            await resourcaManager.createRelation(relation)
        }
        catch(err){
            throw new Error('There was an error creating dimx relation ' + err)
        }
    }

    async uploadFileToDIMX(file:any, schemaName:string, papiClient: PapiClient) : Promise<any>{
        const ansFromImport = await papiClient.addons.data.import.file.uuid(this.addonUUID).table(schemaName).upsert(file)
        return ansFromImport
    }

}