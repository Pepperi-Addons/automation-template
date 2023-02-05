import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncService } from "../services/sync-tests-service";
import { AuditLogService } from "../services/audit-log-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { Client } from "@pepperi-addons/debug-server/dist";

export interface TestCommand {
    setupSchemes(): Promise<any>;
    pushData(adalService: ADALTableService): Promise<any>;
    syncData(): Promise<any>;
    test(objToTest: any, expect: Chai.ExpectStatic): Promise<any>;
    execute(expect: Chai.ExpectStatic): Promise<void>;
}

export class BaseCommand implements TestCommand {
    protected syncService: SyncService;
    protected auditLogService: AuditLogService;
    protected syncAdalService: SyncAdalService;
    protected TIME_TO_SLEEP_FOR_ADAL: number
  
    constructor(syncAdalService:SyncAdalService, client: Client) {
        this.syncService = new SyncService(client)
        this.auditLogService = new AuditLogService(client)
        this.syncAdalService = syncAdalService;
        this.TIME_TO_SLEEP_FOR_ADAL = 5000;
    }
    setupSchemes(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    pushData(adalService: ADALTableService): Promise<any> {
        throw new Error("Method not implemented.");
    }
    syncData(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    test(objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }
    async execute(expect: Chai.ExpectStatic): Promise<void> {
      const adalService =  await this.setupSchemes()
      await this.pushData(adalService)
      const res =  await this.syncData()
      await this.test(res, expect)       
  }
}