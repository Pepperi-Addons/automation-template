import { PapiClient } from "@pepperi-addons/papi-sdk";
import { get } from "https";
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

}
