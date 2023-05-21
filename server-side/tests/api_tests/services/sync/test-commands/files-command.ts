import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand as BaseCommand } from "./base-command";
import { AddonUUID} from '../../../../../../addon.config.json'
import { SyncFileService } from "../services/sync-file-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { Client } from "@pepperi-addons/debug-server/dist";


export class FilesCommand extends BaseCommand {
    private fileToDownload : string = ''
    private fileNotToDownload : string = ''
    private client: Client
    private papiClient: PapiClient
    private syncFileService: SyncFileService 
    constructor(syncAdalService: SyncAdalService, client: Client){
        super(syncAdalService, client)
        this.client = client
        this.papiClient = syncAdalService.papiClient
        this.syncFileService = new SyncFileService(this.client, this.papiClient, true)
    }
    
    async setupSchemes(): Promise<void> {
        return Promise.resolve(undefined)
    }
  
    async pushData(adalService: ADALTableService): Promise<any> {
        // create files and upload
        const fileToUpload = this.syncAdalService.generateFieldsData(1, 1, 1)

        const notDownloadableUrl = await this.syncFileService.uploadFile(fileToUpload,false)
        this.fileNotToDownload = notDownloadableUrl

        const downloadableUrl = await this.syncFileService.uploadFile(fileToUpload,true)
        this.fileToDownload = downloadableUrl
    }

    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, false, false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.getSyncData(syncRes)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        const downloadableFile = await this.syncDataResult.getFile(this.fileToDownload)
        const notDownloadableFile = await this.syncDataResult.getFile(this.fileNotToDownload)
        expect(downloadableFile.URL).to.equal(this.fileToDownload)
        expect(notDownloadableFile.URL).to.equal(this.fileNotToDownload)
        expect(downloadableFile.DownloadToWebApp).to.equal(true)
        expect(notDownloadableFile.DownloadToWebApp).to.equal(false)
    }
    
  }