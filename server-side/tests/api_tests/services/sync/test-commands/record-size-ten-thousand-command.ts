import { RecordSizeCommand } from "./record-size-command";

export class RecordSizeTenThousandCommand extends RecordSizeCommand {
    MAX_CHARS_IN_RECORD = 10000
}