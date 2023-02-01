import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncTestService } from "../services/sync-tests-service";

export interface TestCommand {
    setupSchemes(): Promise<any>;
    pushData(adalService: ADALTableService): Promise<any>;
    syncData(): Promise<any>;
    test(objToTest: any, expect: Chai.ExpectStatic)
    execute(expect: Chai.ExpectStatic): Promise<void>;
}

export class BaseCommand implements TestCommand {
    protected syncTestService: SyncTestService;
  
    constructor(syncTestService: SyncTestService) {
        this.syncTestService = syncTestService;
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
    test(objToTest: any, expect: Chai.ExpectStatic) {
        throw new Error("Method not implemented.");
    }
    async execute(expect: Chai.ExpectStatic): Promise<void> {
      const adalService =  await this.setupSchemes()
      await this.pushData(adalService)
      const res =  await this.syncData()
      await this.test(res, expect)       
  }
}