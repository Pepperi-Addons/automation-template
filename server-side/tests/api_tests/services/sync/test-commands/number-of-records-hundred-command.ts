import { NumberOfRecordsCommand } from "./number-of-records-command";


export class HundredRecordsCommand extends NumberOfRecordsCommand {
    protected override MAX_RECORDS_TO_UPLOAD: number = 400;

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes,false)
        return this.syncDataResult.data;
    }
  }