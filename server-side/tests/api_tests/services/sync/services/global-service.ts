export class GlobalService {
    static async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }  
}