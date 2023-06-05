import { DebugServer } from '@pepperi-addons/debug-server';
import config from '../addon.config.json';

const dir = __dirname;
const server = new DebugServer({
    addonUUID: '02754342-e0b5-4300-b728-a94ea5e0e8f4',
    apiDirectory: dir,
    port: 4600,
});

// serve the plugin file locally
server.addStaticFolder(
    `/assets/plugins/${config.AddonUUID}/${config.AddonVersion}`,
    process.cwd() + '/../publish/editors',
);

// serve the plugin assets locally
server.addStaticFolder(
    `/Addon/Public/${config.AddonUUID}/${config.AddonVersion}`,
    process.cwd() + '/../publish/assets',
);
server.addStaticFolder(
    `/assets/plugins/${config.AddonUUID}/${config.AddonVersion}`,
    process.cwd() + '/../publish/assets',
);

server.start();

console.log(
    'Open webapp at: ',
    `${config.WebappBaseUrl}/settings/${config.AddonUUID}/${config.DefaultEditor}?dev=true`,
);
