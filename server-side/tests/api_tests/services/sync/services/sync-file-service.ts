import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { Agent } from "https";
import fetch, { HttpMethod } from "node-fetch";

import { v4 as uuid } from 'uuid';
const PFS_TABLE_NAME = "integration_test_file_of_sync";
 
export const KB = 1024;
export const UPLOAD_SYNC_FILE_PATH = "/synctests/get"

export class SyncFileService {
    papiClient: PapiClient 

    constructor(papiClient: PapiClient){
        this.papiClient = papiClient
    }
    private urlsToDownload: string[] = []
    private addonUUID = '02754342-e0b5-4300-b728-a94ea5e0e8f4'


    createPFSSchema() {
        return this.papiClient.addons.data.schemes.post({
            Type: "pfs",
            Name: PFS_TABLE_NAME,
        });
    }
    convertToCSV(body: any) {
        const header = Object.keys(body[0]).join(',');
        const rows = body.map(row => Object.values(row).join(','));
        return [header, ...rows].join('\n')
    }
    async uploadFilesAndImport(body: any, schemaName: string) {
        const rowLimit = 300000;
        const chucks = Math.ceil(body.length / rowLimit);
        for (let i = 0; i < chucks; i++) {
            const start = i * rowLimit;
            const end = (i + 1) * rowLimit;
            const chunk = body.slice(start, end);
            // debugger
            await this.uploadFileAndImport(chunk, schemaName);
        }
    }
    async uploadFileAndImport(body: any[], schemaName: string) {
        // convert to csv
        const csv = this.convertToCSV(body);
        let fileURL = await this.uploadObject();
        //upload Object To S3
        await this.apiCall('PUT', fileURL.PresignedURL, csv).then((res) => res.text());
        console.log('successfully uploaded file')
        console.log(fileURL.URL)
        if (fileURL != undefined && fileURL.URL != undefined) {
            const file = {
                'URI': fileURL.URL,
                'OverwriteObject': false,
                'Delimiter': ',',
                "Version": "1.0.3"
            }
            const ansFromImport = await this.papiClient.addons.data.import.file.uuid(this.addonUUID).table(schemaName).upsert(file)
            const ansFromAuditLog = await this.pollExecution(this.papiClient, ansFromImport.ExecutionUUID!, 2000 + body.length*0.01, 6000);
            if (ansFromAuditLog.success === true) {
                const downloadURL = JSON.parse(ansFromAuditLog.resultObject).URI;
                console.log('successfully imported file')
                console.log(downloadURL);
                this.urlsToDownload.push(downloadURL)
            }
            else {
                throw new Error(`Failed to import file`);
            }
        }
    }
    async uploadObject() {
        const url = `/addons/pfs/${this.addonUUID}/${PFS_TABLE_NAME}`
        let expirationDateTime = new Date();
        expirationDateTime.setDate(expirationDateTime.getDate() + 1);
        const body = {
            "Key": "/tempBulkAPI/" + uuid() + ".csv",
            "MIME": "text/csv",
            "ExpirationDateTime": expirationDateTime
        }
        return await this.papiClient.post(url, body);
    }
    async apiCall(method: HttpMethod, url: string, body: any = undefined) {
        const agent = new Agent({
            rejectUnauthorized: false,
        })
        const options: any = {
            method: method,
            agent: agent,
            headers: { 'Content-Type':'text/csv' }
        };
        if (body) {
            options.body = typeof body !== 'string' ? JSON.stringify(body) : body;
        }
        const res = await fetch(url, options);
        if (!res.ok) {
            // try parsing error as json
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch { }
            throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
        }
        return res;
    }
    async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
        return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    }) {
        let attempts = 0;
        const executePoll = async (resolve, reject) => {
            const result = await papiClient.get(`/audit_logs/${ExecutionUUID}`);
            attempts++;
            if (validate(result)) {
                return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
            }
            else if (maxAttempts && attempts === maxAttempts) {
                return resolve({ "success": false, "errorCode": 1 });
            }
            else {
                setTimeout(executePoll, interval, resolve, reject);
            }
        };
        return new Promise<any>(executePoll);
    }

    get filesToDownload(){
        return this.urlsToDownload
    }
}