import { Browser } from '../utilities/browser';
import { Page } from './Pages/base/Page';
import config from '../../../config';
import { By } from 'selenium-webdriver';
import { ConsoleColors } from '../../server_side/general.service';

export class WebAppDialog extends Page {
    constructor(protected browser: Browser) {
        super(browser, `${config.baseUrl}`);
    }

    public Dialog: By = By.css('pep-dialog');
    public Title: By = By.css('pep-dialog .dialog-title');
    public Content: By = By.css('div [pep-dialog-content]');
    public ButtonArr: By = By.css('pep-dialog button');
    public doneBtn: By = By.css('[data-qa="doneButton"]');
    public cancelBtn: By = By.css('[data-qa="cancelButton"]');
    public xBtn: By = By.xpath('//pep-dialog//mat-icon[@role="img"]//pep-icon[@name="system_close"]');

    ///Object Types Editor Locators
    public EditorContent: By = By.css('pep-dialog .mat-dialog-content');
    public EditorTextBoxInput: By = By.css('pep-dialog .mat-dialog-content pep-textbox input');
    public EditorTextAreaInput: By = By.css('pep-dialog .mat-dialog-content pep-textarea [matinput]');
    public EditorInput: By = By.css('pep-dialog .mat-dialog-content .pep-field input');
    public EditorMatInput: By = By.css('pep-dialog .mat-dialog-content .pep-field [matinput]');

    public DialogXpath: By = By.xpath('.//pep-dialog');

    //Iframe Dialogs
    public IframeDialog: By = By.css('.warning-dialog');
    public IframeDialogMessage: By = By.css('.warning-dialog #msgModalTextContent');
    public IframeDialogCancelBtn: By = By.css('.warning-dialog #msgModalLeftBtn');
    public IframeDialogApproveBtn: By = By.css('.warning-dialog #msgModalRightBtn');

    public async selectDialogBoxBeforeNewOrder(buttonText = 'Yes'): Promise<void> {
        /**
         * Click to dismiss if dialog box found
         */
        try {
            await this.browser.ClickByText(this.ButtonArr, buttonText);
        } catch (error) {
            console.log(`%cElement ${this.ButtonArr.toString()} not found`, ConsoleColors.Error);
        }
        return;
    }

    public async selectDialogBox(buttonText: string): Promise<void> {
        /**
         * Click to dismiss if dialog box found
         */
        try {
            await this.browser.ClickByText(this.ButtonArr, buttonText);
        } catch (error) {
            console.log(`%cElement ${this.ButtonArr.toString()} not found`, ConsoleColors.Error);
        }
        return;
    }

    public async selectDialogBoxByText(btnText: string): Promise<void> {
        const selectedBtn = Object.assign({}, this.DialogXpath);
        selectedBtn['value'] += ` //span[contains(., '${btnText}')]`;
        await this.browser.click(selectedBtn);
        return;
    }

    public async getDialogBoxText(): Promise<string> {
        return await this.browser.findElement(this.Content, 4000).then(
            async (res) => {
                return await res.getText();
            },
            () => {
                console.log(`%cElement ${this.ButtonArr.toString()} not found`, ConsoleColors.Error);
                return `Element ${this.ButtonArr.toString()} not found`;
            },
        );
    }
}
