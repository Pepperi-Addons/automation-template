import { SchemaExistsCommand } from "./schema-exists-command";

class ConnectAccountCommand extends SchemaExistsCommand {
    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, false, true)
        return auditLog
    }

 
    async test(syncRes, expect) {
        
    }
}