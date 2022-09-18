import { PapiClient } from "@pepperi-addons/papi-sdk";

export class RemovableResource {

    constructor(public papiClient: PapiClient) {
        this.papiClient = papiClient;
    }

    async removeResource():Promise<any> {
        // remove the resource somehow
    }

    async initResource():Promise<any> {
        // initialize the resource somehow
    }
}