//44c97115-6d14-4626-91dc-83f176e9a0fc
import {
    FindOptions,
    User,
    PapiClient,
    DataImportInput,
    DIMXObject,
    FileExportInput,
    FileImportInput,
    RecursiveExportInput,
    RecursiveImportInput,
} from '@pepperi-addons/papi-sdk';
// import GeneralService from '../../../potentialQA_SDK/server_side/general.service';
import { FileExportOutput, FileImportOutput, RecursiveImportOutput, RecursiveExportOutput, CreateMappingInput, CreateMappingOutput, DIMX_ADDON_UUID } from './DIMXTests_types_and_schemes';
import fetch from 'node-fetch';
import { GeneralService } from 'test_infra';


export class DimxTestsService {
    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;
    dataObject: any;

    constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject: any) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag
        this.dataObject = dataObject;
    }
    BaseURL = `/addons/api/${DIMX_ADDON_UUID}/api`;

    //this function will ALWAYS call REAL AWS papi
    getUsers(options?: FindOptions): Promise<User[]> {
        return this.papiClient.users.find(options);
    }

    //this function will call the server by 'isLocal' flag passed to 'run' endpoint
    createUser(body: User): Promise<User> {
        return this.routerClient.post('/CreateUser', body);
    }


    async DIMXDataImport(addonUUID: string, table: string, body: DataImportInput): Promise<DIMXObject[]> {
        try {
            const RelativeURL = `${this.BaseURL}/data_import?addon_uuid=${addonUUID}&table=${table}`;

            const DIMXObjects: DIMXObject[] = await this.routerClient.post(RelativeURL, body);
            return DIMXObjects;
        }
        catch (ex) {
            console.error(`DIMXDataImport: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
        //return this.papiClient.addons.data.import.uuid(addonUUID).table(table).upsert(body)
    }


    async SyncDIMXFileExport(addonUUID: string, table: string, body: FileExportInput): Promise<FileExportOutput> {
        try {
            const RelativeURL = `${this.BaseURL}/file_export?addon_uuid=${addonUUID}&table=${table}`;

            const fileExportOutput: FileExportOutput = await this.routerClient.post(RelativeURL, body);
            return fileExportOutput;
        }
        catch (ex) {
            console.error(`SyncDIMXFileExport: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
        //return this.papiClient.addons.data.export.file.uuid(addonUUID).table(table).get(body)
    }

    async SyncDIMXFileImport(addonUUID: string, table: string, body: FileImportInput): Promise<FileImportOutput> {
        try {
            const RelativeURL = `${this.BaseURL}/file_import?addon_uuid=${addonUUID}&table=${table}`;

            const fileImportOutput: FileImportOutput = await this.routerClient.post(RelativeURL, body);
            return fileImportOutput;
        }
        catch (ex) {
            console.error(`SyncDIMXFileImport: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
        //return this.papiClient.addons.data.import.file.uuid(addonUUID).table(table).upsert(body)
    }

    async SyncDIMXRecursiveFileImport(addonUUID: string, table: string, body: RecursiveImportInput): Promise<RecursiveImportOutput> {
        try {
            const RelativeURL = `${this.BaseURL}/recursive_import?addon_uuid=${addonUUID}&table=${table}`;

            const recursiveImportOutput: RecursiveImportOutput = await this.routerClient.post(RelativeURL, body);
            return recursiveImportOutput;
        }
        catch (ex) {
            console.error(`SyncDIMXRecursiveFileImport: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async SyncDIMXRecursiveFileExport(addonUUID: string, table: string, body: RecursiveExportInput): Promise<RecursiveExportOutput> {
        try {
            const RelativeURL = `${this.BaseURL}/recursive_export?addon_uuid=${addonUUID}&table=${table}`;

            const recursiveExportOutput: RecursiveExportOutput = await this.routerClient.post(RelativeURL, body);
            return recursiveExportOutput;
        }
        catch (ex) {
            console.error(`SyncDIMXRecursiveFileExport: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async syncDIMXCreateMapping(addonUUID: string, table: string, body: CreateMappingInput): Promise<CreateMappingOutput> {
        try {
            const RelativeURL = `${this.BaseURL}/create_mapping?addon_uuid=${addonUUID}&table=${table}`;

            const createMappingOutput: CreateMappingOutput = await this.routerClient.post(RelativeURL, body);
            return createMappingOutput;
        }
        catch (ex) {
            console.error(`syncDIMXCreateMapping: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async DownloadJSONFromURL(URL) {
        try {
            const response = await fetch(URL);
            const textData: string = await response.text();
            const JSONData = JSON.parse(textData);
            return JSONData;
        }
        catch (ex) {
            console.log(`DownloadJSONFromURL: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }
}
