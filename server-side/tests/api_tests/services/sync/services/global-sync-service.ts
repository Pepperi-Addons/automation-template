import { get } from "https"; 

export class GlobalSyncService {
    static async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
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
}