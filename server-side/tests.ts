import { Client } from '@pepperi-addons/debug-server';
import { TesterFunctions } from 'test_infra';
import { mapUuidToTestName, runTest } from './tests_functions';

// import { runTest } from './potentialQA_SDK/tests_functions';

/**
 * this is the function which 'runs' the test - first function to run once you send the http to the server
 * @param client the client object which received from user 
 * @param request HTTP request received from user - this is the http request you send via postman
 * @param testerFunctions mocha functions passed from infra 
 * @returns tests result
 */
export async function run(client: Client, request: any, testerFunctions: TesterFunctions) {
    const testedAddonUUID = request.body.AddonUUID;// this is the UUID of tested addon passed inside body
    const nameOfTest = request.body.TestName;// this is the UUID of tested addon passed inside body
    console.log(`asked to run ${testedAddonUUID} test: ${nameOfTest ? nameOfTest : "ALL"}`);
    return (await runTest(testedAddonUUID, nameOfTest, client, request, testerFunctions));
}

export async function which_tests_for_addonUUID(_, request: any, __) {
    const addonUUID = request.body.AddonUUID;// this is the UUID of tested addon passed inside body
    return (mapUuidToTestName(addonUUID));
}
