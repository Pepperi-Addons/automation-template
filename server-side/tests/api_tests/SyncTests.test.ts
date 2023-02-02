import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { SyncService } from "./services/sync/services/sync-tests-service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { performance } from "perf_hooks";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";
import { AuditLogService } from "./services/sync/services/audit-log-service";
import { SyncAdalService } from "./services/sync/services/sync-adal-service";

// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
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
        const papiClient = addonService.papiClient; 
      
        let tests: Test[] = [
          {
            name: 'CleanRebuild',
            command: CommandFactory.createCommand('CleanRebuild', syncService,auditLogService,syncAdalService)
          },
          {
            name: 'SchemaExistsTest',
            command: CommandFactory.createCommand('SchemaExistsTest', syncService,auditLogService,syncAdalService)
          },
          {
            name: 'CleanupCommand',
            command: CommandFactory.createCommand('CleanupCommand', syncService,auditLogService,syncAdalService)
          },
          {
            name: 'FutureDateCommand',
            command: CommandFactory.createCommand('FutureDateTest', syncService,auditLogService,syncAdalService)
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