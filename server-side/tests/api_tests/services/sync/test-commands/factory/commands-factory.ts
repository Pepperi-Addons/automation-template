import { Client } from "@pepperi-addons/debug-server/dist";
import { SyncAdalService } from "../../services/sync-adal-service";
import { 
  CleanRebuild,
  CleanupCommand,
  FutureDateCommand,
  PapiConnectAccountCommand,
  ReturnURLCommand,
  SchemaExistsCommand,
  SystemFilterAccount,
  SystemFilterNone,
  SystemFilterUser,
  TestCommand,
  WACDCommand,
} from "..";

export class CommandFactory {
  // a map of command types to command classes
  private static commandMap = {
    CleanRebuild: CleanRebuild,
    SchemaExistsTest: SchemaExistsCommand,
    FutureDateCommand: FutureDateCommand,
    ReturnURLCommand: ReturnURLCommand,
    WACDCommand: WACDCommand,
    PapiConnectAccountCommand: PapiConnectAccountCommand,
    SystemFilterNone: SystemFilterNone,
    SystemFilterAccount: SystemFilterAccount,
    SystemFilterUser:SystemFilterUser,
    CleanupCommand: CleanupCommand
  };

  static createCommand(type: string, syncAdalService: SyncAdalService, client: Client): TestCommand {
    const CommandClass = CommandFactory.commandMap[type];
    if (!CommandClass) {
      throw new Error('Unknown command type');
    }
    return new CommandClass(syncAdalService, client);
  }
}