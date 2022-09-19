import { By } from 'selenium-webdriver';
import { Browser } from '../../../../utilities/browser';
import { PageTesterSectionBlock, PageTesterBlockName } from './base/index';

export class StaticTester extends PageTesterSectionBlock {
    constructor(blockId: string, browser: Browser) {
        super(PageTesterBlockName.StaticTester, blockId, browser);
    }

    public readonly BlockContainer = By.css(`static-tester[block-id='${this.blockId}']`);

    public readonly TestText = By.css(`${this.BlockContainer.value} #testText textarea`);

    public readonly BlockLoadBtn = By.css(`${this.BlockContainer.value} #blockLoadBtn`);

    public readonly ApiCallBtn = By.css(`${this.BlockContainer.value} #apiCallBtn`);

    public async getTestText(): Promise<string | null> {
        return await this.browser.getElementAttribute(this.TestText, 'title');
    }

    public async clickBlockLoadBtn(): Promise<void> {
        return await this.browser.click(this.BlockLoadBtn);
    }

    public async clickApiCallBtn(): Promise<void> {
        return await this.browser.click(this.ApiCallBtn);
    }
}
