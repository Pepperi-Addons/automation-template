"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const papi_sdk_1 = require("@pepperi-addons/papi-sdk");
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const perf_hooks_1 = require("perf_hooks");
const adal_service_1 = require("./adal.service");
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const tester_1 = require("../tester");
exports.testData = {
    'API Testing Framework': ['eb26afcd-3cf2-482e-9ab1-b53c41a6adbe', ''],
    'Services Framework': ['00000000-0000-0000-0000-000000000a91', '9.5.%'],
    'Cross Platforms API': ['00000000-0000-0000-0000-000000abcdef', '9.5.200'],
    'WebApp API Framework': ['00000000-0000-0000-0000-0000003eba91', '16.80.7'],
    'WebApp Platform': ['00000000-0000-0000-1234-000000000b2b', '16.85.85'],
    'Settings Framework': ['354c5123-a7d0-4f52-8fce-3cf1ebc95314', '9.5.%'],
    'Addons Manager': ['bd629d5f-a7b4-4d03-9e7c-67865a6d82a9', '0.'],
    'Data Views API': ['484e7f22-796a-45f8-9082-12a734bac4e8', '1.'],
    ADAL: ['00000000-0000-0000-0000-00000000ada1', '1.'],
    'Automated Jobs': ['fcb7ced2-4c81-4705-9f2b-89310d45e6c7', ''],
    'Relations Framework': ['5ac7d8c3-0249-4805-8ce9-af4aecd77794', ''],
    'Object Types Editor': ['04de9428-8658-4bf7-8171-b59f6327bbf1', '1.'],
    'Notification Service': ['00000000-0000-0000-0000-000000040fa9', ''],
    'Item Trade Promotions': ['b5c00007-0941-44ab-9f0e-5da2773f2f04', ''],
    'Order Trade Promotions': ['375425f5-cd2f-4372-bb88-6ff878f40630', ''],
    'Package Trade Promotions': ['90b11a55-b36d-48f1-88dc-6d8e06d08286', ''],
};
exports.testDataForInitUser = {
    'API Testing Framework': ['eb26afcd-3cf2-482e-9ab1-b53c41a6adbe', ''],
    'Services Framework': ['00000000-0000-0000-0000-000000000a91', '9.5.%'],
    'Cross Platforms API': ['00000000-0000-0000-0000-000000abcdef', '9.5.200'],
    'WebApp API Framework': ['00000000-0000-0000-0000-0000003eba91', '16.80.7'],
    'WebApp Platform': ['00000000-0000-0000-1234-000000000b2b', '16.85.85'],
    'Settings Framework': ['354c5123-a7d0-4f52-8fce-3cf1ebc95314', '9.5.%'],
    'Addons Manager': ['bd629d5f-a7b4-4d03-9e7c-67865a6d82a9', '0.'],
    'Data Views API': ['484e7f22-796a-45f8-9082-12a734bac4e8', '1.'],
    ADAL: ['00000000-0000-0000-0000-00000000ada1', '1.'],
    'Automated Jobs': ['fcb7ced2-4c81-4705-9f2b-89310d45e6c7', ''],
    'Relations Framework': ['5ac7d8c3-0249-4805-8ce9-af4aecd77794', ''],
    'Object Types Editor': ['04de9428-8658-4bf7-8171-b59f6327bbf1', '1.'],
    'Notification Service': ['00000000-0000-0000-0000-000000040fa9', ''],
    'Item Trade Promotions': ['b5c00007-0941-44ab-9f0e-5da2773f2f04', ''],
    'Order Trade Promotions': ['375425f5-cd2f-4372-bb88-6ff878f40630', ''],
    'Package Trade Promotions': ['90b11a55-b36d-48f1-88dc-6d8e06d08286', ''],
};
exports.ConsoleColors = {
    MenuHeader: 'color: #FFFF00',
    MenuBackground: 'background-color: #000000',
    SystemInformation: 'color: #F87217',
    Information: 'color: #FFD801',
    FetchStatus: 'color: #893BFF',
    PageMessage: 'color: #6C2DC7',
    NevigationMessage: 'color: #3BB9FF',
    ClickedMessage: 'color: #00FFFF',
    SentKeysMessage: 'color: #C3FDB8',
    ElementFoundMessage: 'color: #6AFB92',
    BugSkipped: 'color: #F535AA',
    Error: 'color: #FF0000',
    Success: 'color: #00FF00',
};
console.log('%cLogs Colors Information:\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.MenuHeader}`); //Black, Yellow
console.log('%c#F87217\t\tSystem Information\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.SystemInformation}`); //Pumpkin Orange
console.log('%c#FFD801\t\tInformation\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.Information}`); //Rubber Ducky Yellow
console.log('%c#893BFF\t\tFetch Status\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.FetchStatus}`); //Aztech Purple
console.log('%c#6C2DC7\t\tPage Message\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.PageMessage}`); //Purple Amethyst
console.log('%c#3BB9FF\t\tNevigation Message\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.NevigationMessage}`); //Deep Sky Blue
console.log('%c#00FFFF\t\tClicked Message\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.ClickedMessage}`); //Aqua
console.log('%c#C3FDB8\t\tSentKeys Message\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.SentKeysMessage}`); //Light Jade
console.log('%c#6AFB92\t\tElement Found Message\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.ElementFoundMessage}`); //Dragon Green
console.log('%c#F535AA\t\tBug Skipped\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.BugSkipped}`); //Neon Pink
console.log('%c#FF0000\t\tError\t\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.Error}`); //red
console.log('%c#00FF00\t\tSuccess\t\t\t', `${exports.ConsoleColors.MenuBackground}; ${exports.ConsoleColors.Success}`); //green
/**
 * This listner will be added when scripts start from the API or from CLI
 * In cased of errors from selenium-webdriver libary or an error that includes message of "Error"
 * The process will end
 */
process.on('unhandledRejection', async (error) => {
    if (error instanceof Error && JSON.stringify(error.stack).includes('selenium-webdriver\\lib\\http.js')) {
        console.log(`%cError in Chrome API: ${error}`, exports.ConsoleColors.Error);
        console.log('Wait 10 seconds before trying to call the browser api again');
        console.debug(`%cSleep: ${10000} milliseconds`, exports.ConsoleColors.Information);
        msSleep(10000);
    }
    else if (error instanceof Error && JSON.stringify(error.message).includes('Error')) {
        console.log(`%cError unhandledRejection: ${error.message}`, exports.ConsoleColors.Error);
        console.log(`%cIn cases of unhandledRejection that include message of "Error" the process stopped`, exports.ConsoleColors.SystemInformation);
        process.exit(1);
    }
    else {
        console.log(`%cError unhandledRejection: ${error}`, exports.ConsoleColors.Error);
        console.debug(`%cSleep: ${4000} milliseconds`, exports.ConsoleColors.Information);
        msSleep(4000);
    }
});
const UserDataObject = {
    UserEmail: 'email',
    UserName: 'name',
    UserID: 'pepperi.id',
    UserUUID: 'pepperi.useruuid',
    DistributorID: 'pepperi.distributorid',
    DistributorUUID: 'pepperi.distributoruuid',
    Server: 'pepperi.datacenter',
    IdpURL: 'iss',
};
class GeneralService {
    constructor(client) {
        this.client = client;
        this.papiClient = new papi_sdk_1.PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID.length > 10 ? client.AddonUUID : '02754342-e0b5-4300-b728-a94ea5e0e8f4',
            addonSecretKey: client.AddonSecretKey,
        });
        this.adalService = new adal_service_1.ADALService(this.papiClient);
        this.assetsBaseUrl = client.AssetsBaseUrl;
    }
    /**
     * This is Async/Non-Blocking sleep
     * @param ms
     * @returns
     */
    sleepAsync(ms) {
        console.debug(`%cAsync Sleep: ${ms} milliseconds`, exports.ConsoleColors.Information);
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * This is Synchronic/Blocking sleep
     * This should be used in most cases
     * @param ms
     * @returns
     */
    sleep(ms) {
        console.debug(`%cSleep: ${ms} milliseconds`, exports.ConsoleColors.Information);
        msSleep(ms);
        return;
    }
    addQueryAndOptions(url, options = {}) {
        const optionsArr = [];
        Object.keys(options).forEach((key) => {
            optionsArr.push(key + '=' + encodeURIComponent(options[key]));
        });
        const query = optionsArr.join('&');
        return query ? url + '?' + query : url;
    }
    initiateTesterFunctions(client, testName) {
        const testEnvironment = client.BaseURL.includes('staging')
            ? 'Sandbox'
            : client.BaseURL.includes('papi-eu')
                ? 'Production-EU'
                : 'Production';
        const { describe, expect, assert, it, run, setNewTestHeadline, addTestResultUnderHeadline, printTestResults } = tester_1.Tester(client, testName, testEnvironment);
        return {
            describe,
            expect,
            assert,
            it,
            run,
            setNewTestHeadline,
            addTestResultUnderHeadline,
            printTestResults,
        };
    }
    async initiateTester(email, pass) {
        const getToken = await this.getToken(email, pass);
        return this.createClient(getToken.access_token);
    }
    async getToken(email, pass) {
        const urlencoded = new URLSearchParams();
        urlencoded.append('username', email);
        urlencoded.append('password', pass);
        urlencoded.append('scope', 'pepperi.apint pepperi.wacd offline_access');
        urlencoded.append('grant_type', 'password');
        urlencoded.append('client_id', 'ios.com.wrnty.peppery');
        let server;
        if (process.env.npm_config_server) {
            server = process.env.npm_config_server;
        }
        else {
            server = this.papiClient['options'].baseURL.includes('staging') ? 'stage' : '';
        }
        const getToken = await node_fetch_1.default(`https://idp${server == 'stage' ? '.sandbox' : ''}.pepperi.com/connect/token`, {
            method: 'POST',
            body: urlencoded,
        })
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
        if (!(getToken === null || getToken === void 0 ? void 0 : getToken.access_token)) {
            throw new Error(`Error unauthorized\nError: ${getToken.error}\nError description: ${getToken.error_description}`);
        }
        return getToken;
    }
    createClient(authorization) {
        if (!authorization) {
            throw new Error('Error unauthorized');
        }
        const token = authorization.replace('Bearer ', '') || '';
        const parsedToken = jwt_decode_1.default(token);
        const [AddonUUID, sk] = this.getSecret();
        return {
            AddonUUID: AddonUUID,
            AddonSecretKey: sk,
            BaseURL: parsedToken['pepperi.baseurl'],
            OAuthAccessToken: token,
            AssetsBaseUrl: this.assetsBaseUrl ? this.assetsBaseUrl : 'http://localhost:4400/publish/assets',
            Retry: function () {
                return;
            },
            ValidatePermission() {
            }
        };
    }
    // getSecretfromKMS() {}
    getSecret() {
        let addonUUID;
        if (this.client.AddonUUID.length > 0) {
            addonUUID = this.client.AddonUUID;
        }
        else {
            addonUUID = JSON.parse(fs_1.default.readFileSync('../addon.config.json', { encoding: 'utf8', flag: 'r' }))['AddonUUID'];
        }
        let sk;
        if (this.client.AddonSecretKey && this.client.AddonSecretKey.length > 0) {
            sk = this.client.AddonSecretKey;
        }
        else {
            try {
                sk = fs_1.default.readFileSync('../../../var_sk', { encoding: 'utf8', flag: 'r' });
            }
            catch (error) {
                console.log(`%cSK Not found: ${error}`, exports.ConsoleColors.SystemInformation);
                sk = '00000000-0000-0000-0000-000000000000';
            }
        }
        return [addonUUID, sk];
    }
    CalculateUsedMemory() {
        const used = process.memoryUsage();
        const memoryUsed = {};
        for (const key in used) {
            memoryUsed[key] = Math.round((used[key] / 1024 / 1024) * 100) / 100;
        }
        console.log(`%cMemory Use in MB = ${JSON.stringify(memoryUsed)}`, exports.ConsoleColors.SystemInformation);
    }
    PrintMemoryUseToLog(state, testName) {
        console.log(`%c${state} ${testName} Test System Information:`, exports.ConsoleColors.SystemInformation);
        this.CalculateUsedMemory();
    }
    //#region getDate
    getTime() {
        const getDate = new Date();
        return (getDate.getHours().toString().padStart(2, '0') +
            ':' +
            getDate.getMinutes().toString().padStart(2, '0') +
            ':' +
            getDate.getSeconds().toString().padStart(2, '0'));
    }
    getDate() {
        const getDate = new Date();
        return (getDate.getDate().toString().padStart(2, '0') +
            '/' +
            (getDate.getMonth() + 1).toString().padStart(2, '0') +
            '/' +
            getDate.getFullYear().toString().padStart(4, '0'));
    }
    //#endregion getDate
    getServer() {
        return this.client.BaseURL.includes('staging')
            ? 'Sandbox'
            : this.client.BaseURL.includes('papi-eu')
                ? 'Production-EU'
                : 'Production';
    }
    getClientData(data) {
        return jwt_decode_1.default(this.client.OAuthAccessToken)[UserDataObject[data]];
    }
    getInstalledAddons(options) {
        return this.papiClient.addons.installedAddons.find(options);
    }
    getSystemAddons() {
        return this.papiClient.addons.find({ where: 'Type=1', page_size: -1 });
    }
    getVARInstalledAddons(varKey, options = {}) {
        let url = `${this.client.BaseURL.replace('papi-eu', 'papi')}/var/addons/installed_addons`;
        url = this.addQueryAndOptions(url, options);
        return this.fetchStatus(url, {
            method: `GET`,
            headers: {
                Authorization: `Basic ${Buffer.from(varKey).toString('base64')}`,
            },
        });
    }
    getVARDistributor(varKey, options = {}) {
        let url = `${this.client.BaseURL.replace('papi-eu', 'papi')}/var/distributors`;
        url = this.addQueryAndOptions(url, options);
        return this.fetchStatus(url, {
            method: `GET`,
            headers: {
                Authorization: `Basic ${Buffer.from(varKey).toString('base64')}`,
            },
        });
    }
    getAddonsByUUID(UUID) {
        return this.papiClient.addons.installedAddons.addonUUID(UUID).get();
    }
    getCatalogs(options) {
        return this.papiClient.catalogs.find(options);
    }
    getUsers(options) {
        return this.papiClient.users.find(options);
    }
    getAllActivities(options) {
        return this.papiClient.allActivities.find(options);
    }
    getTypes(resource_name) {
        return this.papiClient.metaData.type(resource_name).types.get();
    }
    getAllTypes(options) {
        return this.papiClient.types.find(options);
    }
    getDistributor() {
        return this.papiClient.get('/distributor');
    }
    async getAuditLogResultObjectIfValid(uri, loopsAmount = 30) {
        let auditLogResponse;
        do {
            auditLogResponse = await this.papiClient.get(uri);
            auditLogResponse =
                auditLogResponse === null
                    ? auditLogResponse
                    : auditLogResponse[0] === undefined
                        ? auditLogResponse
                        : auditLogResponse[0];
            //This case is used when AuditLog was not created at all (This can happen and it is valid)
            if (auditLogResponse === null) {
                this.sleep(4000);
                console.log('%cAudit Log was not found, waiting...', exports.ConsoleColors.Information);
                loopsAmount--;
            }
            //This case will only retry the get call again as many times as the "loopsAmount"
            else if (auditLogResponse.Status.ID == '2' || auditLogResponse.Status.ID == '5') {
                this.sleep(2000);
                console.log(`%c${auditLogResponse.Status.ID === 2 ? 'In_Progres' : 'Started'}: Status ID is ${auditLogResponse.Status.ID}, Retry ${loopsAmount} Times.`, exports.ConsoleColors.Information);
                loopsAmount--;
            }
        } while ((auditLogResponse === null || auditLogResponse.Status.ID == '2' || auditLogResponse.Status.ID == '5') &&
            loopsAmount > 0);
        //Check UUID
        try {
            // debugger;
            if (auditLogResponse.DistributorUUID == auditLogResponse.UUID ||
                auditLogResponse.DistributorUUID == auditLogResponse.Event.User.UUID ||
                auditLogResponse.UUID == auditLogResponse.Event.User.UUID ||
                auditLogResponse.Event.User.UUID != this.getClientData('UserUUID')) {
                throw new Error('Error in UUID in Audit Log API Response');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                error.stack = 'UUID in Audit Log API Response:\n' + error.stack;
            }
            throw error;
        }
        //Check Date and Time
        try {
            // debugger;
            if (!auditLogResponse.CreationDateTime.includes(new Date().toISOString().split('T')[0] && 'Z') ||
                !auditLogResponse.ModificationDateTime.includes(new Date().toISOString().split('T')[0] && 'Z')) {
                throw new Error('Error in Date and Time in Audit Log API Response');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                error.stack = 'Date and Time in Audit Log API Response:\n' + error.stack;
            }
            throw error;
        }
        //Check Type and Event
        try {
            // debugger;
            if ((auditLogResponse.AuditType != 'action' && auditLogResponse.AuditType != 'data') ||
                (auditLogResponse.Event.Type != 'code_job_execution' &&
                    auditLogResponse.Event.Type != 'addon_job_execution' &&
                    auditLogResponse.Event.Type != 'scheduler' &&
                    auditLogResponse.Event.Type != 'sync' &&
                    auditLogResponse.Event.Type != 'deployment') ||
                auditLogResponse.Event.User.Email != this.getClientData('UserEmail')) {
                throw new Error('Error in Type and Event in Audit Log API Response');
            }
        }
        catch (error) {
            debugger;
            if (error instanceof Error) {
                error.stack = 'Type and Event in Audit Log API Response:\n' + error.stack;
            }
            throw error;
        }
        return auditLogResponse;
    }
    async areAddonsInstalled(testData) {
        const isInstalledArr = [];
        const installedAddonsArr = await this.getInstalledAddons({ page_size: -1 });
        let installResponse;
        for (const addonName in testData) {
            const addonUUID = testData[addonName][0];
            const version = testData[addonName][1];
            const isInstalled = installedAddonsArr.find((addon) => addon.Addon.Name == addonName) ? true : false;
            if (!isInstalled) {
                //API Testing Framework AddonUUID
                if (addonUUID == 'eb26afcd-3cf2-482e-9ab1-b53c41a6adbe') {
                    installResponse = await this.papiClient.addons.installedAddons
                        .addonUUID(`${addonUUID}`)
                        .install('0.0.235');
                }
                else {
                    if (version.match(/\d+[\.]\d+[/.]\d+/)) {
                        const versionToInstall = version.match(/\d+[\.]\d+[/.]\d+/);
                        if ((version === null || version === void 0 ? void 0 : version.length) && typeof version[0] === 'string') {
                            installResponse = await this.papiClient.addons.installedAddons
                                .addonUUID(`${addonUUID}`)
                                .install(String(versionToInstall));
                        }
                        else {
                            installResponse = await this.papiClient.addons.installedAddons
                                .addonUUID(`${addonUUID}`)
                                .install();
                        }
                    }
                    else {
                        installResponse = await this.papiClient.addons.installedAddons
                            .addonUUID(`${addonUUID}`)
                            .install();
                    }
                }
                const auditLogResponse = await this.getAuditLogResultObjectIfValid(installResponse.URI, 40);
                if (auditLogResponse.Status && auditLogResponse.Status.ID != 1) {
                    isInstalledArr.push(false);
                    continue;
                }
            }
            isInstalledArr.push(true);
        }
        return isInstalledArr;
    }
    async uninstallAddon(addonUuid) {
        return this.papiClient.addons.installedAddons.addonUUID(addonUuid).uninstall();
    }
    /**
     * changes the version of the already installed addons based on 'test data'
     * @param varKey
     * @param testData
     * @param isPhased if true will query only for pahsed versions
     * @returns
     */
    async changeVersion(varKey, testData, isPhased) {
        var _a, _b;
        for (const addonName in testData) {
            const addonUUID = testData[addonName][0];
            const version = testData[addonName][1];
            let changeType = 'Upgrade';
            let searchString = `AND Version Like'${version}%' AND Available Like 1 AND Phased Like 1`;
            if (addonName == 'Services Framework' ||
                addonName == 'Cross Platforms API' ||
                addonName == 'API Testing Framework' ||
                addonName == 'WebApp Platform' || //evgeny
                // addonName == 'ADAL' || //evgeny
                addonName == 'system_health' || //evgeny
                addonName == 'WebApp API Framework' || // 8/5: CPAS MUST ALWAYS BE SENT WITH FULL VERSION (xx.xx.xx)
                !isPhased) {
                searchString = `AND Version Like '${version}%' AND Available Like 1`;
            }
            // if (addonName == 'ADAL' && this.papiClient['options'].baseURL.includes('staging')) {
            //     searchString = `AND Version Like '${version}%' AND Available Like 1`;
            // }
            const fetchVarResponse = await this.fetchStatus(`${this.client.BaseURL.replace('papi-eu', 'papi')}/var/addons/versions?where=AddonUUID='${addonUUID}'${searchString}&order_by=CreationDateTime DESC`, {
                method: `GET`,
                headers: {
                    Authorization: `Basic ${Buffer.from(varKey).toString('base64')}`,
                },
            });
            let varLatestVersion;
            if (fetchVarResponse.Body.length > 0 && fetchVarResponse.Status == 200) {
                try {
                    varLatestVersion = fetchVarResponse.Body[0].Version;
                }
                catch (error) {
                    throw new Error(`Get latest addon version failed: ${version}, Status: ${varLatestVersion.Status}, Error Message: ${JSON.stringify(fetchVarResponse.Error)}`);
                }
            }
            else if (fetchVarResponse.Body.length > 0 && fetchVarResponse.Status == 401) {
                throw new Error(`Fetch Error - Verify The varKey, Status: ${fetchVarResponse.Status}, Error Message: ${fetchVarResponse.Error.title}`);
            }
            else if (fetchVarResponse.Body.length > 0) {
                throw new Error(`Get latest addon version failed: ${version}, Status: ${fetchVarResponse.Status}, Error Message: ${JSON.stringify(fetchVarResponse.Error)}`);
            }
            if (varLatestVersion) {
                testData[addonName].push(varLatestVersion);
            }
            else {
                testData[addonName].push(version);
            }
            let varLatestValidVersion = varLatestVersion;
            if (fetchVarResponse.Body.length === 0) {
                varLatestValidVersion = undefined;
            }
            let upgradeResponse = await this.papiClient.addons.installedAddons
                .addonUUID(`${addonUUID}`)
                .upgrade(varLatestValidVersion);
            let auditLogResponse = await this.getAuditLogResultObjectIfValid(upgradeResponse.URI, 40);
            if (fetchVarResponse.Body.length === 0) {
                varLatestValidVersion = auditLogResponse.AuditInfo.ToVersion;
            }
            if (auditLogResponse.Status && auditLogResponse.Status.Name == 'Failure') {
                if (!auditLogResponse.AuditInfo.ErrorMessage.includes('is already working on newer version')) {
                    testData[addonName].push(changeType);
                    testData[addonName].push(auditLogResponse.Status.Name);
                    testData[addonName].push(auditLogResponse.AuditInfo.ErrorMessage);
                }
                else {
                    changeType = 'Downgrade';
                    upgradeResponse = await this.papiClient.addons.installedAddons
                        .addonUUID(`${addonUUID}`)
                        .downgrade(varLatestValidVersion);
                    auditLogResponse = await this.getAuditLogResultObjectIfValid(upgradeResponse.URI, 40);
                    testData[addonName].push(changeType);
                    testData[addonName].push(String((_a = auditLogResponse.Status) === null || _a === void 0 ? void 0 : _a.Name));
                }
            }
            else {
                testData[addonName].push(changeType);
                testData[addonName].push(String((_b = auditLogResponse.Status) === null || _b === void 0 ? void 0 : _b.Name));
            }
        }
        return testData;
    }
    async changeToAnyAvailableVersion(testData) {
        var _a, _b;
        for (const addonName in testData) {
            const addonUUID = testData[addonName][0];
            const version = testData[addonName][1];
            let changeType = 'Upgrade';
            const searchString = `AND Version Like '${version}%' AND Available Like 1`;
            const fetchResponse = await this.fetchStatus(`${this.client.BaseURL}/addons/versions?where=AddonUUID='${addonUUID}'${searchString}&order_by=CreationDateTime DESC`, {
                method: `GET`,
            });
            let LatestVersion;
            if (fetchResponse.Status == 200) {
                try {
                    LatestVersion = fetchResponse.Body[0].Version;
                }
                catch (error) {
                    throw new Error(`Get latest addon version failed: ${version}, Status: ${LatestVersion.Status}, Error Message: ${JSON.stringify(fetchResponse.Error)}`);
                }
            }
            else {
                throw new Error(`Get latest addon version failed: ${version}, Status: ${fetchResponse.Status}, Error Message: ${JSON.stringify(fetchResponse.Error)}`);
            }
            testData[addonName].push(LatestVersion);
            let upgradeResponse = await this.papiClient.addons.installedAddons
                .addonUUID(`${addonUUID}`)
                .upgrade(LatestVersion);
            let auditLogResponse = await this.getAuditLogResultObjectIfValid(upgradeResponse.URI, 90);
            if (auditLogResponse.Status && auditLogResponse.Status.Name == 'Failure') {
                if (!auditLogResponse.AuditInfo.ErrorMessage.includes('is already working on newer version')) {
                    //debugger;
                    testData[addonName].push(changeType);
                    testData[addonName].push(auditLogResponse.Status.Name);
                    testData[addonName].push(auditLogResponse.AuditInfo.ErrorMessage);
                }
                else {
                    changeType = 'Downgrade';
                    upgradeResponse = await this.papiClient.addons.installedAddons
                        .addonUUID(`${addonUUID}`)
                        .downgrade(LatestVersion);
                    auditLogResponse = await this.getAuditLogResultObjectIfValid(upgradeResponse.URI, 90);
                    testData[addonName].push(changeType);
                    testData[addonName].push(String((_a = auditLogResponse.Status) === null || _a === void 0 ? void 0 : _a.Name));
                }
            }
            else {
                testData[addonName].push(changeType);
                testData[addonName].push(String((_b = auditLogResponse.Status) === null || _b === void 0 ? void 0 : _b.Name));
            }
        }
        return testData;
    }
    fetchStatus(uri, requestInit) {
        var _a;
        const start = perf_hooks_1.performance.now();
        let responseStr;
        let parsed = {};
        let errorMessage = {};
        let OptionalHeaders = Object.assign({ Authorization: `Bearer ${this.papiClient['options'].token}` }, requestInit === null || requestInit === void 0 ? void 0 : requestInit.headers);
        if (((_a = requestInit === null || requestInit === void 0 ? void 0 : requestInit.headers) === null || _a === void 0 ? void 0 : _a.Authorization) === null) {
            OptionalHeaders = undefined;
        }
        return node_fetch_1.default(`${uri.startsWith('/') ? this['client'].BaseURL + uri : uri}`, {
            method: `${(requestInit === null || requestInit === void 0 ? void 0 : requestInit.method) ? requestInit === null || requestInit === void 0 ? void 0 : requestInit.method : 'GET'}`,
            body: typeof (requestInit === null || requestInit === void 0 ? void 0 : requestInit.body) == 'string' ? requestInit.body : JSON.stringify(requestInit === null || requestInit === void 0 ? void 0 : requestInit.body),
            headers: OptionalHeaders,
            timeout: requestInit === null || requestInit === void 0 ? void 0 : requestInit.timeout,
            size: requestInit === null || requestInit === void 0 ? void 0 : requestInit.size,
        })
            .then(async (response) => {
            var _a;
            const end = perf_hooks_1.performance.now();
            const isSucsess = response.status > 199 && response.status < 400 ? true : false;
            console[isSucsess ? 'log' : 'debug'](`%cFetch ${isSucsess ? '' : 'Error '}${(requestInit === null || requestInit === void 0 ? void 0 : requestInit.method) ? requestInit === null || requestInit === void 0 ? void 0 : requestInit.method : 'GET'}: ${uri.startsWith('/') ? this['client'].BaseURL + uri : uri} took ${(end - start).toFixed(2)} milliseconds`, `${isSucsess ? exports.ConsoleColors.FetchStatus : exports.ConsoleColors.Information}`);
            try {
                if ((_a = response.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.startsWith('image')) {
                    responseStr = await response.buffer().then((r) => r.toString('base64'));
                    parsed = {
                        Type: 'image/base64',
                        Text: responseStr,
                    };
                }
                else {
                    responseStr = await response.text();
                    parsed = responseStr ? JSON.parse(responseStr) : '';
                }
            }
            catch (error) {
                if (responseStr && responseStr.substring(20).includes('xml')) {
                    parsed = {
                        Type: 'xml',
                        Text: responseStr,
                    };
                    errorMessage = parseResponse(responseStr);
                }
                else if (responseStr && responseStr.substring(20).includes('html')) {
                    parsed = {
                        Type: 'html',
                        Text: responseStr,
                    };
                    errorMessage = parseResponse(responseStr);
                }
                else {
                    parsed = {
                        Type: 'Error',
                        Text: responseStr,
                    };
                    errorMessage = error;
                }
            }
            const headersArr = {};
            response.headers.forEach((value, key) => {
                headersArr[key] = value;
            });
            return {
                Ok: response.ok,
                Status: response.status,
                Headers: headersArr,
                Body: parsed,
                Error: errorMessage,
            };
        })
            .catch((error) => {
            console.error(`Error type: ${error.type}, ${error}`);
            return {
                Ok: undefined,
                Status: undefined,
                Headers: undefined,
                Body: {
                    Type: error.type,
                    Name: error.name,
                },
                Error: error.message,
            };
        });
    }
    async getLatestSchemaByKeyAndFilterAttributes(key, addonUUID, tableName, filterAttributes, loopsAmount) {
        let schemaArr, latestSchema;
        let maxLoopsCounter = loopsAmount === undefined ? 12 : loopsAmount;
        do {
            this.sleep(1500);
            schemaArr = await this.adalService.getDataFromSchema(addonUUID, tableName, {
                order_by: 'CreationDateTime DESC',
            });
            maxLoopsCounter--;
            latestSchema = this.extractSchema(schemaArr, key, filterAttributes);
        } while (Array.isArray(latestSchema) && maxLoopsCounter > 0);
        return latestSchema;
    }
    async baseAddonVersionsInstallation(varPass, otherTestData) {
        const isInstalledArr = await this.areAddonsInstalled(otherTestData ? otherTestData : exports.testData);
        const chnageVersionResponseArr = await this.changeVersion(varPass, otherTestData ? otherTestData : exports.testData, false);
        return { chnageVersionResponseArr: chnageVersionResponseArr, isInstalledArr: isInstalledArr };
    }
    // async sendResultsToMonitoringAddon(userName: string, testName: string, testStatus: string, env: string) {
    //     const addonsSK = this.getSecret()[1];
    //     const testingAddonUUID = 'eb26afcd-3cf2-482e-9ab1-b53c41a6adbe';
    //     const current = new Date();
    //     const time = current.toLocaleTimeString();
    //     const body = {
    //         Name: `${testName}_${time}`, //param:addon was tested (test name)
    //         Description: `Running on: ${userName} - ${env}`, //param: version of the addon
    //         Status: testStatus, //param is passing
    //         Message: 'evgeny', //param link to Jenkins
    //         NotificationWebhook: '',
    //         SendNotification: '',
    //     };
    //     // const monitoringResult = await this.fetchStatus('/system_health/notifications', {
    //     //     method: 'POST',
    //     //     headers: {
    //     //         'X-Pepperi-SecretKey': addonsSK,
    //     //         'X-Pepperi-OwnerID': testingAddonUUID,
    //     //     },
    //     //     body: JSON.stringify(body),
    //     // });
    //     return {};
    //     //except(monitoringResult.Ok).to.equal(true);
    //     //except(monitoringResult.Status).to.equal(200);
    //     //except(monitoringResult.Error).to.equal({});
    // }
    extractSchema(schema, key, filterAttributes) {
        outerLoop: for (let j = 0; j < schema.length; j++) {
            const entery = schema[j];
            if (!entery.Key.startsWith(key) || entery.IsTested) {
                continue;
            }
            if (filterAttributes.AddonUUID) {
                if (entery.Message.FilterAttributes.AddonUUID != filterAttributes.AddonUUID[0]) {
                    continue;
                }
            }
            if (filterAttributes.Resource) {
                if (entery.Message.FilterAttributes.Resource != filterAttributes.Resource[0]) {
                    continue;
                }
            }
            if (filterAttributes.Action) {
                if (entery.Message.FilterAttributes.Action != filterAttributes.Action[0]) {
                    continue;
                }
            }
            if (filterAttributes.ModifiedFields) {
                if (entery.Message.FilterAttributes.ModifiedFields.length != filterAttributes.ModifiedFields.length) {
                    continue;
                }
                for (let i = 0; i < filterAttributes.ModifiedFields.length; i++) {
                    const field = filterAttributes.ModifiedFields[i];
                    if (entery.Message.FilterAttributes.ModifiedFields.includes(field)) {
                        continue;
                    }
                    else {
                        continue outerLoop;
                    }
                }
            }
            return schema[j];
        }
        return schema;
    }
    isValidUrl(s) {
        //taken from https://tutorial.eyehunts.com/js/url-validation-regex-javascript-example-code/
        const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', // fragment locator
        'i');
        return !!pattern.test(s.replace(' ', '%20'));
    }
    /**
     * This uses the var endpoint, this is why this have to get varKey
     * @param addonUUID
     * @param varKey this have to from the api or the cli that trigger this process
     * @returns
     */
    async getSecretKey(addonUUID, varKey) {
        const updateVersionResponse = await this.fetchStatus(this['client'].BaseURL.replace('papi-eu', 'papi') + `/var/addons/${addonUUID}/secret_key`, {
            method: `GET`,
            headers: {
                Authorization: `Basic ${Buffer.from(varKey).toString('base64')}`,
            },
        });
        return updateVersionResponse.Body.SecretKey;
    }
    generateRandomString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += String.fromCharCode(97 + Math.floor(Math.random() * 26));
        }
        return result;
    }
    async executeScriptFromTestData(scriptName) {
        await child_process_1.execFileSync(`${__dirname.split('services')[0]}api-tests\\test-data\\${scriptName}`);
        return;
    }
    /**
     * will return true if dateToTest param is indicating a time point which happened less than howLongAgo milliseconds ago
     * @param dateToTest tested date in millisecods
     * @param howLongAgo less than how many milliseconds should pass
     * @param timeDiff time diff between the time zone which the machine running the code is in and time zone tested date taken from
     * @returns
     */
    isLessThanGivenTimeAgo(dateToTest, howLongAgo, timeDiff) {
        if (timeDiff)
            dateToTest += timeDiff;
        const timeAgo = Date.now() - howLongAgo;
        return dateToTest > timeAgo;
    }
    replaceAll(string, searchValue, replaceValue) {
        const regex = new RegExp(searchValue, 'g');
        return string.replace(regex, replaceValue);
    }
}
exports.GeneralService = GeneralService;
function msSleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function parseResponse(responseStr) {
    const errorMessage = {};
    responseStr = responseStr.replace(/\s/g, '');
    responseStr = responseStr.replace(/.......(?<=style>).*(?=<\/style>)......../g, '');
    responseStr = String(responseStr.match(/......(?<=head>).*(?=<\/body>)......./));
    const headerStr = String(responseStr.match(/(?<=head>).*(?=<\/head>)/));
    const headerTagsMatched = String(headerStr.match(/(?<=)([\w\s\.\,\:\;\'\"]+)(?=<\/)..[\w\s]+/g));
    const headerTagsArr = headerTagsMatched.split(/,|<\//);
    const bodyStr = String(responseStr.match(/(?<=body>).*(?=<\/body>)/));
    const bodyStrTagsMatched = String(bodyStr.match(/(?<=)([\w\s\.\,\:\;\'\"]+)(?=<\/)..[\w\s]+/g));
    const bodyStrTagsArr = bodyStrTagsMatched.split(/,|<\//);
    for (let index = 1; index < headerTagsArr.length; index += 2) {
        errorMessage.Header = {};
        errorMessage.Header[`${headerTagsArr[index]}`] = headerTagsArr[index - 1];
    }
    for (let index = 1; index < bodyStrTagsArr.length; index += 2) {
        errorMessage.Body = {};
        errorMessage.Body[`${bodyStrTagsArr[index]}`] = bodyStrTagsArr[index - 1];
    }
    return errorMessage;
}
//# sourceMappingURL=general.service.js.map