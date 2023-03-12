import { TesterFunctions } from 'test_infra';
import { Client } from '@pepperi-addons/debug-server';
import { runTest } from 'test_infra';

/**
 * this is the function which 'runs' the test - first function to run once you send the http to the server
 * @param client the client object which received from user 
 * @param request HTTP request received from user - this is the http request you send via postman
 * @returns tests result
 */
export async function import_dimx_object_do_nothing(client: Client, request: any) {
    return request.body
}
