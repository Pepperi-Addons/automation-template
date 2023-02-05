import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncService } from "../services/sync-tests-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { Client } from "@pepperi-addons/debug-server/dist";

export interface TestCommand {
    setupSchemes(): Promise<any>;
    pushData(adalService: ADALTableService): Promise<any>;
    sync(): Promise<any>;
    test(objToTest: any, syncData: any, expect: Chai.ExpectStatic): Promise<any>;
    execute(expect: Chai.ExpectStatic): Promise<void>;
}

export class BaseCommand implements TestCommand {
    protected syncService: SyncService;
    protected syncAdalService: SyncAdalService;

  
    constructor(syncAdalService:SyncAdalService, client: Client) {
        this.syncService = new SyncService(client)
        this.syncAdalService = syncAdalService;
    }
    setupSchemes(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    pushData(adalService: ADALTableService): Promise<any> {
        throw new Error("Method not implemented.");
    }
    sync(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    processSyncResponse(syncRes:any):Promise<any>{
        throw new Error("Method not implemented.");
    }
    test(objToTest: any,syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async execute(expect: Chai.ExpectStatic): Promise<void> {
      const adalService =  await this.setupSchemes()
      await this.pushData(adalService)
      const syncRes =  await this.sync()
      const syncData = await this.processSyncResponse(syncRes)
      await this.test(syncRes, syncData, expect)       
  }
}