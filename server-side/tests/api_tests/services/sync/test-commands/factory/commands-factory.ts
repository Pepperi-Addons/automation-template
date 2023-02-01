import { SyncTestService } from "../../services/sync-tests-service";
import { AnotherSyncTestCommand } from "../another-sync-test-command";
import { BaseSyncCommand } from "../base-sync-command";
import { TestCommand } from "../base-command";
import { FutureDateCommand } from "../future-date-command";

export class CommandFactory {
    static createCommand(type: string, syncTestService: SyncTestService): TestCommand {
      switch (type) {
        case 'BaseSyncTest':
          return new BaseSyncCommand(syncTestService);
        case 'FutureDateTest':
          return new FutureDateCommand(syncTestService);
        default:
          throw new Error('Unknown command type');
      }
    }
  } 