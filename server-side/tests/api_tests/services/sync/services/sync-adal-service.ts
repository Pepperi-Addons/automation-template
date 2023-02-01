import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient, AddonDataScheme, SchemeField, AddonData } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { v4 as uuid } from 'uuid';

export class SyncAdalService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;
    schemaName: string;
    adalServcies:ADALTableService[] = [];

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.schemaName="integration_test_schema_of_sync_" + uuid().split('-').join('_');
    }
    generateSchemeWithFields(fieldNumber:number): AddonDataScheme {
    let fieldNames: {[key:string]:SchemeField} = {}
    for(let i=1;i<fieldNumber+1;i++) {
        let fieldName = "Field"+i
        fieldNames[fieldName]= {"Type": "String"}
    }

    const syncSchema:AddonDataScheme = {
        Name: this.schemaName,
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
        this.adalServcies.push(adalService)
        return adalService
    }

    generateFieldsData(numberOfFields:number ,numberOfCharacters: number): AddonData{
        let fieldData=''
        for( let i=0; i<numberOfCharacters; i++){
            fieldData+='.'
        }
        let data: AddonData = {Key: "1", Fields:[]}
        for(let i=1;i<numberOfFields+1;i++){
            data.Fields["Field"+i] = fieldData
        }
        return data
    }
    get schemeName(){
        return this.schemaName
    }
}