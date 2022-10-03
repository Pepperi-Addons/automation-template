import { TesterFunctions } from './potentialQA_SDK/server_side/general.service';
import { Client } from '@pepperi-addons/debug-server';

import { runTest } from './potentialQA_SDK/tests_functions';

/**
 * this is the function which 'runs' the test - first function to run once you send the http to the server
 * @param client the client object which received from user 
 * @param request HTTP request received from user - this is the http request you send via postman
 * @param testerFunctions mocha functions passed from infra 
 * @returns tests result
 */
export async function run(client: Client, request: any, testerFunctions: TesterFunctions) {
    const testedAddonUUID = request.body.AddonUUID;// this is the UUID of tested addon passed inside body
    console.log(`asked to run ${testedAddonUUID} tests`);
    await runTest(testedAddonUUID, client, request, testerFunctions);
}
