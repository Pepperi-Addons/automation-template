#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();
const fs = require("fs");
const fetch = require("node-fetch");
const { exit } = require('process');
const cwd = process.cwd();


const templateTestPath = "../potentialQA_SDK/src/templates/template.test.txt";
const templateServicePath = "../potentialQA_SDK/src/templates/template.service.txt";
const serviceLoaction = "../server-side/tests/api_tests/services";
const endpointToAddTemplate = `
export async function template_test_endpoint(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'Fill_Test_Name_Here'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await TemplateTests(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["template_test_endpoint"] = template_test_endpoint;
`;
const templateTestImport = `import { Template } from '../server-side/tests/api_tests/Template.test';`;
const templateServiceImport = `import { ServiceName } from "Path";`;
//const templateCtorLineToReplace = `//ctor replacment line`;
const abc = `const service = new serviceClass(generalService, addonService.papiClient, dataObj);`;

const addonUUIDMapper = '../potentialQA_SDK/src/mapper.ts';
const serverSideTestsEndpointsLocation = '../server-side/tests_functions.ts';
program
    .name('test-creator')
    .description('CLI to create tests templates')
    .version('0.0.1');

program.command('server-side')
    .description('Create a template for server side test')
    .argument('<addonUUID>', 'tested addon UUID')
    .argument('<testName>', 'the name of the test will be created')
    //   .option('--first', 'display just the first substring')
    //   .option('-s, --separator <char>', 'separator character', ',')
    .action(async (addonUUID, testName) => {
        console.log(`${addonUUID} --- ${testName}`);
        validateAddonUUID(addonUUID);
        isAddonAlreadyTested(addonUUID, testName);
        addonName = camelize(testName.toLowerCase());
        // 1. create a new test service
        let serviceClassName = `${testName.charAt(0).toUpperCase() + testName.slice(1)}`;
        let testClassName = `${testName.charAt(0).toUpperCase() + testName.slice(1)}`;
        const newServiceFileName = `${serviceLoaction}/${serviceClassName}.service.ts`;
        copyFileAndChangeContent(templateServicePath, 'TemplateService', `${serviceClassName}Service`, newServiceFileName);
        // 1.2. add the tested addon UUID as a comment at the top of the file
        addContentStartOfFile(`//${addonUUID}`, newServiceFileName);
        serviceClassName = `${serviceClassName}Service`;
        //2. create a new test file for requested addon
        const newTestFileName = `./tests/api_tests/${testClassName}.test.ts`;
        copyFileAndChangeContent(templateTestPath, 'TemplateTests', testClassName, newTestFileName);
        //2.1. add service import on top of the test file
        const servicePathToImport = `./services/${addonName}.service`;
        let newServiceImport = templateServiceImport.replace(/Path/, servicePathToImport);
        newServiceImport = newServiceImport.replace(/ServiceName/, `${serviceClassName}`);
        const pathToTestFile = `../server-side/tests/api_tests/${testName}.test.ts`;
        addContentStartOfFile(newServiceImport, pathToTestFile);
        //2.2. add the tested addon UUID as a comment at the top of the file
        addContentStartOfFile(`//${addonUUID}`, pathToTestFile);
        //2.3 replace template line with new service ctor
        let newCtorToTemplate = abc.replace(/service/, `${addonName}Service`);
        newCtorToTemplate = newCtorToTemplate.replace(/serviceClass/, `${testClassName}Service`);
        // console.log(newCtorToTemplate);
        copyFileAndChangeContent(pathToTestFile, '//templateToTeplaceWithCtor', newCtorToTemplate, pathToTestFile);
        copyFileAndChangeContent(pathToTestFile, 'servicez', `${addonName}Service`, pathToTestFile);
        //3.add addon name to map to addon UUID inside 'mapper.json'
        // //name:uuid
        const addonUUIDNameMapping = `"${testClassName}":"${addonUUID}",\n\t"templateLine":"Template"`;
        copyFileAndChangeContent(addonUUIDMapper, `"templateLine":"Template"`, addonUUIDNameMapping, addonUUIDMapper);
        //3. add the new test file to this addon endpoint
        let newEndpoint = endpointToAddTemplate.replace(/template_test_endpoint/g, camelToSnakeCase(testClassName));
        newEndpoint = newEndpoint.replace(/TemplateTests/g, testClassName);
        newEndpoint = newEndpoint.replace(/Fill_Test_Name_Here/g, testClassName);
        AddContentToFile(serverSideTestsEndpointsLocation, newEndpoint);
        //3.1. add import to new test function to work in test endpoints
        const newTestImportLine = templateTestImport.replace(/Template/g, testClassName);
        addContentStartOfFile(newTestImportLine, serverSideTestsEndpointsLocation);
    });


program.parse();





// const writeStream = fs.createWriteStream(`${addonName}.txt`);
// writeStream.write("Hi, JournalDEV Users. ");
// writeStream.write("Thank You.");
// writeStream.end();

function copyFileAndChangeContent(srcFilePath, placeholderToChange, stringToChangeTo, destFilePath) {
    let data = '';
    try {
        data = fs.readFileSync(srcFilePath, 'utf8');
    } catch (err) {
        console.error(err);
    }
    var re = new RegExp(placeholderToChange, 'g');
    let result = data.replace(re, `${stringToChangeTo}`);
    fs.writeFileSync(destFilePath, result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function AddContentToFile(srcFilePath, stringToAdd) {
    fs.appendFileSync(srcFilePath, stringToAdd, function (err) {
        if (err) {
            console.error(err);
        }
    });
}


function camelToSnakeCase(str) {
    return (str.split(/(?=[A-Z])/).join('_').toLowerCase());
}

function addContentStartOfFile(textToAdd, fileToAddTo) {
    let endpointFileSplitted = fs.readFileSync(fileToAddTo).toString().split('\n');
    endpointFileSplitted.unshift(textToAdd);
    fs.writeFileSync(fileToAddTo, endpointFileSplitted.join('\n'));
}

async function validateAddonUUID(addonUUID) {
    if (addonUUID.length < 36) {
        throw `Provided UUID Is Too Short: '${addonUUID}'`;
    }
    if (addonUUID.length > 36) {
        throw `Provided UUID Is Too Long: '${addonUUID}'`;
    }
}

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

function isAddonAlreadyTested(addonUUID, testName) {
    let mapper = fs.readFileSync("../potentialQA_SDK/src/mapper.ts", 'utf-8');
    let addonUUIDMapper = JSON.parse((mapper.split('=')[1]).replace(';',''));
    for (let [nameOfTest, uuid] of Object.entries(addonUUIDMapper)) {
        if (nameOfTest.toLowerCase() === testName.toLowerCase()) {
            if (uuid === addonUUID) {
                throw Error(`this test name already exists for the same addon uuid - search ${addonUUID} inside the IDE`);
            }
            else {
                throw Error(`this test name already exists for the addon uuid - ${addonUUID}`);
            }
        }
    }
}
