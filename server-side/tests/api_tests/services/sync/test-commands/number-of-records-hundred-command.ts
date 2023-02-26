import { Client } from "@pepperi-addons/debug-server/dist";
import { SyncAdalService } from "../services/sync-adal-service";
import { NumberOfRecordsCommand } from "./number-of-records-command";


export class HundredRecordsCommand extends NumberOfRecordsCommand {
    constructor(syncAdalService: SyncAdalService, client: Client){
        super(syncAdalService, client)
        this.MAX_RECORDS_TO_UPLOAD = 400
      }  
  }