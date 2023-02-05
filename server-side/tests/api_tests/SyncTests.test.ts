import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { SyncService } from "./services/sync/services/sync-tests-service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";
import { AuditLogService } from "./services/sync/services/audit-log-service";
import { SyncAdalService } from "./services/sync/services/sync-adal-service";
import { SystemFilterService } from "./services/sync/services/system-filter-service";


// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions){
  const describe = tester.describe;
  const expect = tester.expect;
  const it = tester.it;
  const dataObj = request.body.Data;
  
    describe("SyncTests Suites",() => {
        const client: Client = generalService['client']
        const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";
        const syncService = new SyncService(client)
        const auditLogService = new AuditLogService(client)
        const syncAdalService = new SyncAdalService(client)
        const systemFilterService = new SystemFilterService(client)
        const papiClient = addonService.papiClient; 
      
        let tests: Test[] = [
          {
            name: 'CleanRebuild',
            command: CommandFactory.createCommand('CleanRebuild', syncService,auditLogService,syncAdalService,systemFilterService)
          },
          {
            name: 'SchemaExistsTest',
            command: CommandFactory.createCommand('SchemaExistsTest', syncService,auditLogService,syncAdalService,systemFilterService)
          },
          {
            name: 'FutureDateCommand',
            command: CommandFactory.createCommand('FutureDateTest', syncService,auditLogService,syncAdalService,systemFilterService)
          },
          {
            name: 'ReturnUrlCommand',
            command: CommandFactory.createCommand('ReturnURLTest', syncService,auditLogService,syncAdalService,systemFilterService)
          },
          {
            name: 'SystemFilterNone',
            command: CommandFactory.createCommand('SystemFilterNone', syncService,auditLogService,syncAdalService,systemFilterService)
          },
          {
            name: 'CleanupCommand',
            command: CommandFactory.createCommand('CleanupCommand', syncService,auditLogService,syncAdalService,systemFilterService)
          },
        ];
      
        for (const test of tests) {
          it(test.name, async () => {
            await test.command.execute(expect);
          });
        }
    });
}


interface Test {
    name: string;
    command: TestCommand;
}
