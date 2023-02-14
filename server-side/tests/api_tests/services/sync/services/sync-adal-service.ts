import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient, AddonDataScheme, SchemeField, AddonData } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { v4 as uuid } from 'uuid';
import { ADALService } from "../../../../../potentialQA_SDK/server_side/adal.service";

export class SyncAdalService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID:string;
    schemaName: string;
    adalResources:ADALTableService[] = [];

    constructor(client: Client){
        this.client = client
        this.systemService = new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient as any;
        this.schemaName = "";
        this.addonUUID = '02754342-e0b5-4300-b728-a94ea5e0e8f4'
    }

    async cleanup() {
        return await Promise.all(this.adalResources.map(resource=> resource.removeResource()))
    }

    async cleanupOtherTestSchemes() {
        const adalService = new ADALService(this.papiClient);
        const schemas = await this.papiClient.addons.data.schemes.get({})
        // filter out schemes with prefix integration_test_schema_of_sync_
        const integrationTestSchemas = schemas.filter(schema => schema.Name.startsWith('integration_test_schema_of_sync'))
        await Promise.all(integrationTestSchemas.map(schema => adalService.deleteSchema(schema.Name)))
    }
    
    generateScehmaName(suffix?: string){
        this.schemaName = "integration_test_schema_of_sync_" + uuid().split('-').join('_')+(suffix ? suffix: '')
        return this.schemaName
    }

    getSchemaNameFromAdalService(adalTableServices : any){
        let name = adalTableServices ?  adalTableServices.map(service =>{
            return service.schemaName
        }) : ''
        return name
    }

    getSchemaNameFromAdalServices(adalTableServices : any){
        let names:{account:string,user:string,none:string} = {
            account:adalTableServices.account.schemaName,
            user:adalTableServices.user.schemaName,
            none:adalTableServices.none.schemaName
        }
        return names
    }

    generateSchemeWithFields(fieldNumber:number): AddonDataScheme {
        let fieldNames: AddonDataScheme['Fields'] = {}
        for(let i=1;i<fieldNumber+1;i++) {
            let fieldName = "Field"+i
            fieldNames[fieldName]= {"Type": "String"}
        }

        const syncSchema:AddonDataScheme = {
            Name: this.generateScehmaName(),
            Type: "data",
            SyncData: {
                Sync: true
            },
            Fields: fieldNames
        }
        return syncSchema
    }

    async getAdalService(schema: AddonDataScheme):Promise<ADALTableService> {
        const adalService = new ADALTableService(this.papiClient,this.addonUUID, schema)
        await adalService.initResource()
        this.adalResources.push(adalService)
        return adalService
    }

    generateFieldsData(numberOfFields:number, numberOfCharacters: number): AddonData[]{
        let fieldData=''
        for( let i=0; i<numberOfCharacters; i++){
            fieldData+='.'
        }
        let data: AddonData[] = []
        for(let i=1;i<numberOfFields+1;i++){
            data.push({Key: i.toString(),["Field"+i]: fieldData})
        }
        return data
    }
    get schemeName(){
        return this.schemaName
    }
}
