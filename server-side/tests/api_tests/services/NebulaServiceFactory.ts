// factory for Nebula service.

import { PapiClient } from "@pepperi-addons/papi-sdk";
import {GeneralService} from '../../../potentialQA_SDK/src/infra_services/general.service';
// import GeneralService from "../../../potentialQA_SDK/server_side/general.service";
import { NebulaLocalFunctions } from "./NebulaLocalFunctions.service";
import { NebulaTestService } from "./NebulaTest.service";

export class NebulaServiceFactory {
    static getNebulaService(systemService: GeneralService, addonService: PapiClient, dataObject: any, isLocal: boolean): NebulaTestService | NebulaLocalFunctions {
        if (isLocal) {
            return new NebulaLocalFunctions(systemService, addonService, dataObject);
        }
        else {
            return new NebulaTestService(systemService, addonService, dataObject);
        }
    }
}