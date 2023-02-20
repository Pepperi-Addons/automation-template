import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncService } from "../services/sync-tests-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { SyncDataResult } from "../sync-data-result";

// TestCommand interface defines the common methods that should be implemented by all test commands
export interface TestCommand {
    setupSchemes(): Promise<any>;
    pushData(adalService: ADALTableService): Promise<any>;
    sync(): Promise<any>;
    test(objToTest: any, syncData: any, expect: Chai.ExpectStatic): Promise<any>;
    cleanup(): Promise<any>;
    execute(expect: Chai.ExpectStatic): Promise<void>;
}

// BaseCommand implements the TestCommand interface and defines common properties and methods shared by all test commands
export class BaseCommand implements TestCommand {
    // syncService is an instance of the SyncService class, which is used to execute sync related operations
    protected syncService: SyncService;
    // syncAdalService is an instance of the SyncAdalService class, which is used to execute ADAL related operations
    protected syncAdalService: SyncAdalService;
    // TIME_TO_SLEEP_FOR_NEBULA is the amount of time (in milliseconds) to wait after upserting data to ADAL and before executing sync (to allow Nebula to process the data)
    protected TIME_TO_SLEEP_FOR_NEBULA: number
    //syncDataResult is an instance of the SyncDataResult class, which is used to store the data result of the sync.
    protected syncDataResult: SyncDataResult

  
    constructor(syncAdalService: SyncAdalService, client: Client) {
        this.syncService = new SyncService(client)
        this.syncAdalService = syncAdalService;
        this.TIME_TO_SLEEP_FOR_NEBULA = 10000;
        this.syncDataResult = new SyncDataResult()
    }
    // setupSchemes should be implemented by child classes and should setup the necessary ADAL schemes
    setupSchemes(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    // pushData should be implemented by child classes and should push data to ADAL
    pushData(adalService: ADALTableService): Promise<any> {
        throw new Error("Method not implemented.");
    }
    // sync should be implemented by child classes and should execute sync.
    // child classes may pass different request parameters to sync
    sync(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    // processSyncResponse should be implemented by child classes and should process the sync response.
    // extract the data from AuditLog or from a given URL.
    processSyncResponse(syncRes:any):Promise<any>{
        throw new Error("Method not implemented.");
    }
    // test should be implemented by child classes and should test the sync response and the data result.
    // parameters:
    // syncRes - the sync response (execution uuid, audit log url, etc.)
    // syncData - the data result of the sync
    test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }

    cleanup(): Promise<any> {
        // do nothing
        return Promise.resolve()
    }



    // execute is the main method of the test command.
    // it executes the following steps:
    // 1. setup schemes
    // 2. push data to ADAL
    // 3. execute sync
    // 4. process the sync response
    // 5. test the sync response and the data result
    async execute(expect: Chai.ExpectStatic): Promise<void> {
      const adalService =  await this.setupSchemes()
      await this.pushData(adalService)
      const syncRes =  await this.sync()
      const syncData = await this.processSyncResponse(syncRes)
      try {
          await this.test(syncRes, syncData, expect)
      } finally {
          await this.cleanup()
        
      }
  }
}