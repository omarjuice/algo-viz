import puppeteer, { Page, Browser } from 'puppeteer'
import expect from 'expect'

type keyDesc = {
    name: string,
    type: 'single' | 'multiple'
}

type DS = {
    name: string
    children: keyDesc[]
    pointers: keyDesc[]
    displayKey: string
    numChildren: number
}

const time = (n: number) => new Promise(r => setTimeout(r, n))

class AppPage {
    page: Page
    browser: Browser
    prevCode: string
    constructor(page: Page, browser: Browser) {
        this.page = page
        this.browser = browser
        page.on("pageerror", async (err) => {
            await this.browser.close()
            throw err
        })
        this.prevCode = "A".repeat(300)

    }
    private async getContents(selector: string) {
        return await this.page.$eval(selector, (el) => el.innerHTML)
    }
    async stepTotal() {
        return Number(await this.getContents('.step-view .step-total'))
    }
    async currentStep() {
        return Number(await this.getContents('.step-view .step-number'))
    }
    async checkForCrash() {
        if (this.page.$('.app') === null) {
            throw new Error('APP crashed.')
        }
    }
    async nextFast() {
        await this.page.click('.fast-next-button')
    }
    async prevSlow() {
        await this.page.click('.slow-prev-button')
    }
    async closeBrowser() {
        await this.browser.close()
    }
    async playPause() {

        await this.page.click('.play-pause-button')
    }
    async waitForStep(n: number) {
        const current = await this.currentStep()
        await new Promise(r => setTimeout(r, (n - current) * 10))
        await this.page.waitForFunction(`Number(document.querySelector('.step-view .step-number').innerHTML)>=${n}`, { timeout: 1000 * 60 * 5, })
    }
    async submitCode(code: string) {

        await this.page.click(`.open-editor-button`)
        await this.page.waitForFunction(`!!document.querySelector('.monaco-editor')`)


        for (let i = 0; i < 4; i++) {
            await this.page.click('.monaco-editor', { clickCount: i + 1 })
            await time(1)
        }
        await this.page.keyboard.press('Backspace')





        for (let i = 0; i < code.length; i++) {

            const char = code[i]

            await this.page.type('.inputarea', char)
            if ('({['.includes(char)) {
                await this.page.keyboard.press('ArrowRight')
                await this.page.keyboard.press('Backspace')
            }


        }
        await this.page.click('.submit-code-button')
        await this.page.waitForFunction(`!document.querySelector('.monaco-editor')`)
        this.prevCode = code
        await this.nextFast()
    }
    async defineDS(ds: DS) {
        await this.page.click('.open-settings')
        await this.page.waitForFunction(`!!document.querySelector('#StructureSettings')`)
        await this.page.evaluate(function () {
            //@ts-ignore
            document.querySelector('#StructureSettings').click()
        })
        await this.page.waitForFunction(`!!document.querySelector('.struct-settings-${ds.name}')`)

        await this.page.evaluate(function (name) {

            const elem = document.querySelector(`.struct-settings-${name} .toggle-edit`)
            //@ts-ignore
            elem.click()
            elem.scrollIntoView()
        }, ds.name)

        for (const child of ds.children) {
            await this.page.type('.add-child-input', child.name)
            await this.page.click('.add-child-button')
            await this.page.select(`#${child.name}-select`, child.type)
        }
        for (const pointer of ds.pointers) {
            await this.page.type('.add-pointer-input', pointer.name)
            await this.page.click('.add-pointer-button')
            await this.page.select(`#${pointer.name}-select`, pointer.type)

        }
        await this.page.focus('.display-key-input')
        for (let i = 0; i < 5; i++) {
            await this.page.keyboard.press('Backspace')
        }
        await this.page.type('.display-key-input', ds.displayKey)
        await this.page.evaluate(function (n) {
            //@ts-ignore
            window.setNumChildren(n)
        }, ds.numChildren)
        await this.page.click('.finished-editing')
        await this.page.click('.close-settings')
    }
    async normalFlow(incremental: boolean, speed = 5) {
        const stepTotal = await this.stepTotal()
        let stepNumber = await this.currentStep()

        expect(typeof stepTotal).toBe('number')
        expect(stepNumber).toBe(0)

        if (incremental) {
            while (stepNumber < stepTotal) {
                await this.nextFast()
                stepNumber = await this.currentStep()
                await this.checkForCrash()
            }
            while (stepNumber > 0) {
                await this.prevSlow()
                stepNumber = await this.currentStep()
                await this.checkForCrash()
            }
        }

        await this.playPause()
        const stepNo = this.waitForStep(Math.floor(stepTotal / 2))
        if (speed > 0) {
            for (let i = 0; i < speed; i++) {
                await this.nextFast()
            }
        }
        if (speed < 0) {
            for (let i = speed; i < 0; i++) {
                await this.prevSlow()
            }
        }
        await this.checkForCrash()
        await stepNo
        await this.playPause()
        await time(100)

        const final = this.waitForStep(stepTotal)

        await this.playPause()
        await final
        await this.playPause()

        await this.waitForStep(2)
        await this.checkForCrash()

    }
}


let page: AppPage;


before(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        // slowMo: 100,
        defaultViewport: {
            width: 1400,
            height: 800
        },
        args: [
            "--window-size=1400,800"
        ]
    })
    const p = await browser.newPage()
    await p.goto('http://localhost:3000')
    page = new AppPage(p, browser)
    await new Promise((r) => {
        setTimeout(r, 1000)
    })
})


after(async () => {

    await new Promise((r) => {
        setTimeout(r, 2000)
    })

    await page.closeBrowser()

})








describe('Launch', function () {
    it('Should render', async () => {
        await page.checkForCrash()
    })
    it('Normal flow', async () => {
        await page.normalFlow(true)
    })
    describe('TwoSum', () => {
        it('->', async () => {
            await page.submitCode(
                `function twoNumberSum(array, targetSum) {
                    const hash = {}
                for(let number of array){
                        if(hash[number]){
                            return number > hash[number] ? [hash[number], number] : [number, hash[number]]
                    }
                    hash[targetSum - number] = number;
            }
                return []
        }
            twoNumberSum([1,2,3,4,5], 5)
           `
            )

            await page.normalFlow(false)
        })
    })
    describe('Fibonacci', () => {
        it('->', async () => {
            await page.submitCode(
                `function getNthFib(n, cache = {}) {
                    // Write your code here.
                    if (n === 1) return 0;
                    if (n === 2) return 1;
                    if (n in cache) return cache[n]
                    cache[n] = getNthFib(n - 1, cache) + getNthFib(n - 2, cache)
                    return cache[n]
            }
            getNthFib(10)
           `
            )
            await page.normalFlow(false)
        })
    })
    describe('BST', () => {
        it('->', async () => {
            await page.submitCode(
                `class BST {
                    constructor(value) {
                      this.value = value;
                      this.left = null;
                      this.right = null;
                }
              
                insert(value) {
                      if (value < this.value) {
                        if (this.left === null) {
                          this.left = new BST(value);
                    } else {
                          this.left.insert(value);
                    }
              } else {
                        if (this.right === null) {
                          this.right = new BST(value);
                    } else {
                          this.right.insert(value);
                    }
              }
                  return this;
            }
          }
           const bst = new BST(100);
           bst.insert(200).insert(5).insert(7).insert(3).insert(300).insert(150)
        
        `
            )
            await page.defineDS({
                name: 'BST',
                children: [
                    { name: 'left', type: 'single' },
                    { name: 'right', type: 'single' }
                ],
                pointers: [
                    { name: 'children', type: 'multiple' },
                ],
                displayKey: 'value',
                numChildren: 2
            })
            await page.normalFlow(false)
        })
    })

    describe('RiverSizes', () => {
        it('->', async () => {
            await page.submitCode(
                `function riverSizes(matrix, rivers = []) {
                    for (let i = 0; i < matrix.length; i++) {
                        for (let j = 0; j < matrix[i].length; j++) {
                            let riverlen = getContinuation(matrix, i, j);
                            if (riverlen) {
                                rivers.push(riverlen);
                        }
                }
            }
                return rivers
        }
            function getContinuation(matrix, i, j) {
                    if (matrix[i] && matrix[i][j]) {
                        let riverlen = 1;
                        matrix[i][j] = null;
                        riverlen += getContinuation(matrix, i + 1, j);
                        riverlen += getContinuation(matrix, i, j + 1);
                        riverlen += getContinuation(matrix, i - 1, j);
                        riverlen += getContinuation(matrix, i, j - 1);
                        return riverlen;
                }
                return 0;
        }
            const matrix = Viz.array.matrix(2,2,1)
            const rivers = [];
            riverSizes(matrix, rivers)`
            )

            await page.normalFlow(false)
        })
    })
    describe('Weird stuff', () => {
        it('->', async () => {
            await page.submitCode(
                `const arr = [1,2,3];
                 arr[10] = 100
                 arr.length = 5
                
                `
            )

            await page.normalFlow(false, -2)
        })
    })
    describe('Tree Children reassignment', () => {
        it('->', async () => {
            await page.submitCode(
                `class Tree{
                    constructor(name){
                        this.name = name
                        this.children = []
                    }
                    add(name){
                        this.children.push(new Tree(name))
                        return this
                    }
                }
                const tree = new Tree('A');
                tree.add('B').add('C').add('D');
                const ch = tree.children;
                tree.children = [];
                tree.add('E').add('F');
                const tree2 = new Tree('G'); 
                tree2.children = ch;
                [tree.children, tree2.children] = [tree2.children, tree.children];
                `
            )
            await page.defineDS({
                name: 'Tree',
                children: [{
                    name: 'children',
                    type: 'multiple'
                }],
                pointers: [],
                displayKey: 'name',
                numChildren: 0
            })
            await page.normalFlow(false, 5)
        })
    })
    describe('Big linked list', () => {
        it('->', async () => {
            await page.submitCode(
                `const list = Viz.SLL.create(Viz.array.sortedInts(18, false));

                let current = list;

                while(current.next){
                    current.value
                    current = current.next
                }

                current.next = list;
                
                for (let i = 0; i < 18; i++){
                    current = current.next;
                }

                `
            )

            await page.normalFlow(false, 5)
        })
    })
    describe('Binary Tree invert & BFS', () => {
        it('->', async () => {
            await page.submitCode(
                `
                const tree = Viz.BTree.create(Viz.array.sortedInts(31, false), 'binary');

function invert(tree) {
    if (tree) [tree.left, tree.right] = [invert(tree.right), invert(tree.left)];
    return tree;
}
invert(tree);

    const queue = new Viz.Queue([tree]);
    const vals = [];

    while(queue.length){
        const {left, right, value} = queue.shift();
        vals.push(value);
        if(left) queue.push(left);
        if(right) queue.push(right);
    }

                `
            )

            await page.normalFlow(false, 5)
        })
    })






})