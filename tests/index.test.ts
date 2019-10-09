import puppeteer, { Page, Browser } from 'puppeteer'
import expect from 'expect'
let browser: Browser, page: Page;

before(async () => {
    browser = await puppeteer.launch({
        headless: false,
        slowMo: 500
    })
    page = await browser.newPage()
    await page.goto('http://localhost:3000')
    if (await page.$('.app') === null) {
        throw new Error('APP not found. Maybe you forgot to start the development server.')
    }
})


after(async () => {
    await page.close()
})


describe('Launch', () => {
    it('Should render', async () => {
        expect(await page.$('.app')).toBeTruthy()
    })
})