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
  PathDataAccount,
  PathDataNone,
  PathDataUser,
  TestCommand,
  WACDCommand,
  TenThousandRecordsCommand,
  ThousandRecordsCommand,
  HundredRecordsCommand,
  PushDataCommand,
  WACDPushDataCommand,
  PushBigDataCommand,
  RecordSizeHundredCommand,
  RecordSizeThousandCommand,
  RecordSizeTenThousandCommand,
  RecordSizeHundredThousandCommand,
  ConnectAccountDelta,
  WebappCommand,
  PushDataTimeCommand,
  UploadDataToSync,
  FilesCommand,
  ContentLengthCommand
} from "..";

export class CommandFactory {
  // a map of command types to command classes
  private static commandMap = {
    CleanRebuild: CleanRebuild,
    SchemaExistsTest: SchemaExistsCommand,
    FutureDateCommand: FutureDateCommand,
    ReturnURLCommand: ReturnURLCommand,
    PapiConnectAccountCommand: PapiConnectAccountCommand,
    PathDataNone: PathDataNone,
    PathDataAccount: PathDataAccount,
    PathDataUser: PathDataUser,
    DeltaTestCommand: DeltaTestCommand,
    ResyncCommand: ResyncCommand,
    WACDCommand: WACDCommand,
    TenThousandRecordsCommand: TenThousandRecordsCommand,
    ThousandRecordsCommand: ThousandRecordsCommand,
    HundredRecordsCommand: HundredRecordsCommand,
    PushDataCommand: PushDataCommand,
    PushBigDataCommand: PushBigDataCommand,
    WACDPushDataCommand: WACDPushDataCommand,
    RecordSizeHundredCommand: RecordSizeHundredCommand,
    RecordSizeThousandCommand: RecordSizeThousandCommand,
    RecordSizeTenThousandCommand: RecordSizeTenThousandCommand,
    RecordSizeHundredThousandCommand: RecordSizeHundredThousandCommand,
    ConnectAccountDelta: ConnectAccountDelta,
    WebappCommand: WebappCommand,
    PushDataTimeCommand: PushDataTimeCommand,
    UploadDataToSync:UploadDataToSync,
    CleanupCommand: CleanupCommand,
    FilesCommand: FilesCommand,
    ContentLengthCommand: ContentLengthCommand
  };

  static createCommand(type: string, syncAdalService: SyncAdalService, client: Client): TestCommand {
    const CommandClass = CommandFactory.commandMap[type];
    if (!CommandClass) {
      throw new Error('Unknown command type');
    }
    return new CommandClass(syncAdalService, client);
  }
}