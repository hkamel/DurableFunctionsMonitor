import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    const host = JSON.parse(await readFileAsync('./host.json'));
    const localSettings = fs.existsSync('./local.settings.json') ?
        JSON.parse(await readFileAsync('./local.settings.json')) : {};

    const connectionString: string = (!!localSettings.Values && !!localSettings.Values.AzureWebJobsStorage) ?
        localSettings.Values.AzureWebJobsStorage : null;
    const hubName: string = (!!host.extensions && !!host.extensions.durableTask && !!host.extensions.durableTask.HubName) ?
        host.extensions.durableTask.HubName : 'DurableFunctionsHub';

    switch (req.method) {
        case 'GET':

            context.res = {
                body: { connectionString, hubName }
            };

            break;
        case 'PUT':

            if (!localSettings.Values) {
                localSettings.Values = {};
            }
            localSettings.Values.AzureWebJobsStorage = req.body.connectionString;

            if (!host.extensions) {
                host.extensions = {};
            }
            if (!host.extensions.durableTask) {
                host.extensions.durableTask = {};
            }
            host.extensions.durableTask.HubName = req.body.hubName;
  
            await writeFileAsync('./local.settings.json', JSON.stringify(localSettings, null, 4));
            await writeFileAsync('./host.json', JSON.stringify(host, null, 4));
            
            break;
        default:
            context.res = { status: 400 };
    }   
};

export default httpTrigger;