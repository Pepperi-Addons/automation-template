import { Client } from "@pepperi-addons/debug-server/dist";
import { SyncAdalService } from "../../services/sync-adal-service";
import { 
  CleanRebuild,
  CleanupCommand,
  DeltaTestCommand,
  FutureDateCommand,
  PapiConnectAccountCommand,
  ResyncCommand,
  ReturnURLCommand,
  SchemaExistsCommand,
  SystemFilterAccount,
  SystemFilterNone,
  SystemFilterUser,
  TestCommand,
  WACDCommand,
  TenThousandRecordsCommand,
  ThousandRecordsCommand,
  HundredRecordsCommand

} from "..";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ResourceManagerService } from "../../../resource_management/resource_manager.service";

export class CommandFactory {
  // a map of command types to command classes
  private static commandMap = {
    CleanRebuild: CleanRebuild,
    SchemaExistsTest: SchemaExistsCommand,
    FutureDateCommand: FutureDateCommand,
    ReturnURLCommand: ReturnURLCommand,
    PapiConnectAccountCommand: PapiConnectAccountCommand,
    SystemFilterNone: SystemFilterNone,
    SystemFilterAccount: SystemFilterAccount,
    SystemFilterUser: SystemFilterUser,
    DeltaTestCommand: DeltaTestCommand,
    ResyncCommand: ResyncCommand,
    WACDCommand: WACDCommand,
    TenThousandRecordsCommand: TenThousandRecordsCommand,
    ThousandRecordsCommand: ThousandRecordsCommand,
    HundredRecordsCommand: HundredRecordsCommand,
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