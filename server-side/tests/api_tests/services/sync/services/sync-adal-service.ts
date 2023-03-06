import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient, AddonDataScheme, SchemeField, AddonData } from "@pepperi-addons/papi-sdk";
import {GeneralService} from "test_infra";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { v4 as uuid } from 'uuid';
import { ADALService } from "test_infra";

export class SyncAdalService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID:string;
    schemaName: string;
    adalResources: ADALTableService[] = [];

    constructor(client: Client){
        debugger;
        this.client = client;
        this.systemService = new GeneralService(this.client);
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

    async changeSchemaToHidden(table: ADALTableService){
        let schema = table.getSchema()
        schema.Hidden = true
        this.adalResources = this.adalResources.filter(r=> r.schemaName != schema.Name)
        return await this.papiClient.addons.data.schemes.post(schema)
    }

    generateSchemeWithFields(fieldNumber: number, schemaNameSuffix: string): AddonDataScheme {
        let fieldNames: AddonDataScheme['Fields'] = {}
        for(let i=1;i<fieldNumber+1;i++) {
            let fieldName = "Field"+i
            fieldNames[fieldName]= {"Type": "String"}
        }

        const syncSchema:AddonDataScheme = {
            Name: this.generateScehmaName(schemaNameSuffix),
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

    generateFieldsData(numberOfFields:number, numberOfCharacters: number,numberOfRecords:number=1): AddonData[]{
        const fieldData='.'.repeat(numberOfCharacters)
        
        let data: AddonData[] = []
        let fields:{} = {}
        for(let i=1;i<numberOfFields+1;i++){
            fields["Field"+i]= fieldData
        }
        for(let i=1;i<numberOfRecords+1;i++){
            data.push({Key: i.toString(), ...fields})
        }
        return data
    }

    getSchemeNamesFromObject(objWithAdalServices:any){
        const services:any= Object.values(objWithAdalServices)
        return services.map(service => {
            return service.schemaName
        })
    }
    
    get schemeName(){
        return this.schemaName
    }
}
