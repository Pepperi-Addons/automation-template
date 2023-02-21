import { get } from "https"; 
import { PapiClient } from "@pepperi-addons/papi-sdk";
import jwt from 'jwt-decode'; 

export class GlobalSyncService {
    static async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    static getCurrentUserUUID(papiClient: PapiClient): string {
        const decodedToken: any = jwt(papiClient['options'].token);
        const currentUser = decodedToken["pepperi.useruuid"];
        return currentUser;
    }

    static async httpGet(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
          get(url, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                  data += chunk;
              });
              res.on('end', () => {
                  try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                  } catch (err) {
                    reject(err);
                  }
              });
          }).on('error', (err) => {
              reject(err);
          });
        });
    }

    static isValidJSON(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
   
    // copied from GlobalService in sync addon
    // this function is used to generate the internal ID of the ADAL table
    public static hashCode(str) { // java String#hashCode //TODO think about that, this is uesd in the MapData table internal ID.
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
          chr   = str.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }        
        return this.validateHashCode(hash);
    }

    public static validateHashCode(hashCode: number) {
        // check if hashCode is positive number
        if (hashCode < 0) {
            // make it positive number
            hashCode = hashCode * -1;
        }
        return hashCode;
    }

}
