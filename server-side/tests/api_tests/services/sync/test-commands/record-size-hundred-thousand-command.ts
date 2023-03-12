import { RecordSizeCommand } from "./record-size-command";

export class RecordSizeHundredThousandCommand extends RecordSizeCommand {
    MAX_CHARS_IN_RECORD = 100000
}