import { SyncTestService } from "../../services/sync-tests-service";
import { BaseSyncCommand } from "../base-sync-command";
import { TestCommand } from "../base-command";
import { FutureDateCommand } from "../future-date-command";
import { AuditLogService } from "../../services/audit-log-service";
import { SyncAdalService } from "../../services/sync-adal-service";
import { ReturnURLCommand } from "../return-url-command";
import { CleanupCommand } from "../cleanup-command";

export class CommandFactory {
    static createCommand(type: string, syncTestService: SyncTestService, auditLogService: AuditLogService, syncAdalService: SyncAdalService): TestCommand {
      switch (type) {
        case 'BaseSyncTest':
          return new BaseSyncCommand(syncTestService,auditLogService,syncAdalService);
        case 'FutureDateTest':
          return new FutureDateCommand(syncTestService,auditLogService,syncAdalService);
          case 'ReturnURLTest':
          return new ReturnURLCommand(syncTestService,auditLogService,syncAdalService);
          case 'CleanupCommand':
          return new CleanupCommand(syncTestService,auditLogService,syncAdalService);
        default:
          throw new Error('Unknown command type');
      }
    }
  } 