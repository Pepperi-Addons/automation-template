import { NumberOfRecordsCommand } from "./number-of-records-command";

export class ThousandRecordsCommand extends NumberOfRecordsCommand {
    protected override MAX_RECORDS_TO_UPLOAD: number = 5000;
  }