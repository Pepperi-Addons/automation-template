import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncTestService } from "../services/sync-tests-service";
import { AuditLogService } from "../services/audit-log-service";
import { SyncAdalService } from "../services/sync-adal-service";

export interface TestCommand {
    setupSchemes(): Promise<any>;
    pushData(adalService: ADALTableService): Promise<any>;
    syncData(): Promise<any>;
    test(objToTest: any, expect: Chai.ExpectStatic): Promise<any>;
    execute(expect: Chai.ExpectStatic): Promise<void>;
}

export class BaseCommand implements TestCommand {
    protected syncTestService: SyncTestService;
    protected auditLogService: AuditLogService;
    protected syncAdalService: SyncAdalService;
  
    constructor(syncTestService: SyncTestService,auditLogService:AuditLogService,syncAdalService:SyncAdalService) {
        this.syncTestService = syncTestService;
        this.auditLogService= auditLogService;
        this.syncAdalService = syncAdalService;
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