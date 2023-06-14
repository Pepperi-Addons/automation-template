import { PapiClient } from "@pepperi-addons/papi-sdk";

export type ModifiedField = {
    FieldID: string,// the field ID
    NewValue: any,// the new value
    OldValue: any,// the old value
}
export type BasicRecord = {
    Key: string;
    [attribute: string]: any
};

export type PNSAction = "update" | "insert" | "remove";

export type ModifiedObject = {
    ObjectKey: string, // the object key
    ModifiedFields: ModifiedField[] // the modified fields
}

export type PNSDataBody = {
    Type: "data",
    FilterAttributes: {
        AddonUUID: string, // 00000000-0000-0000-0000-00000000c07e for nucleus, use lower case
        ModifiedObjects: string[], // list of Object keys
        Resource: string, // the resource name
        Action: PNSAction // the action that was performed
    },
    Message: {
        ModifiedObjects: ModifiedObject[]
    }
}

export type PNSPostBody = {
    addonUUID: string,
    resource: string,
    action: PNSAction,
    modifiedObjects: ModifiedObject[]
}

export class NebulaPNSEmulator {
    papiClient: PapiClient;
    originalBaseURL: string;

    constructor(papiClient: PapiClient) {
        this.papiClient = papiClient;
        this.originalBaseURL = papiClient['options']['baseURL'];
    }

    async generatePNSData(data: PNSPostBody): Promise<PNSDataBody> {
        const body: PNSDataBody = {
            Type: "data",
            FilterAttributes: {
                AddonUUID: data.addonUUID,
                ModifiedObjects: data.modifiedObjects.map(modifiedObject => modifiedObject.ObjectKey),
                Resource: data.resource,
                Action: data.action,
            },
            Message: {
                ModifiedObjects: data.modifiedObjects
            }
        }

        return body;
    }

    async postPNSData(data: PNSPostBody, fullURL: string, headers?: any): Promise<any> {
        try {
            const body = await this.generatePNSData(data);
            this.papiClient['options']['baseURL'] = "";
            const results = await this.papiClient.post(fullURL, body, { ...headers, 'Content-Type': 'application/json' });
            this.papiClient['options']['baseURL'] = this.originalBaseURL;
            return results;
        }
        catch (ex) {
            console.error(`postPNSData - ${ex}`);
            this.papiClient['options']['baseURL'] = this.originalBaseURL;
            throw new Error((ex as { message: string }).message);
        }
    }
}