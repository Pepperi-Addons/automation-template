import { NumberOfRecordsCommand } from "./number-of-records-command";

export class TenThousandRecordsCommand extends NumberOfRecordsCommand {
    protected override MAX_RECORDS_TO_UPLOAD: number = 50000;
  }