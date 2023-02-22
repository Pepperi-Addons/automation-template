import { RecordSizeCommand } from "./record-size-command";

export class RecordSizeThousandCommand extends RecordSizeCommand {
    MAX_CHARS_IN_RECORD = 1000
}