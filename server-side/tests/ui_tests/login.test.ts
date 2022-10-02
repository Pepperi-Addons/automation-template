import { Browser } from '../../potentialQA_SDK/e2e/utilities/browser';
import { describe, it, afterEach, beforeEach } from 'mocha';
import { WebAppLoginPage } from '../../potentialQA_SDK/e2e/e2eInfra.index';

export async function LoginTests(email: string, password: string) {
    let driver: Browser;

    describe('Basic UI Tests Suit', async function () {
        this.retries(1);

        beforeEach(async function () {
            driver = await Browser.initiateChrome();
        });

        afterEach(async function () {
            const webAppLoginPage = new WebAppLoginPage(driver);
            await webAppLoginPage.collectEndTestData(this);
            await driver.quit();
        });

        it('Login', async function () {
            const webAppLoginPage = new WebAppLoginPage(driver);
            await webAppLoginPage.loginWithImage(email, password);
        });
    });
}
