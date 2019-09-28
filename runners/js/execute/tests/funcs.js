module.exports = {
        twoNumberSum: `function twoNumberSum(array, targetSum) {
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
       ` ,
        mergeSort: `function split(wholeArray){
                const result = [];
                const midPoint = Math.floor(wholeArray.length / 2);
                if (wholeArray.length === 0){
                    return undefined;
            }
            else if (wholeArray.length === 1){
                    return wholeArray;
            }
            else {
                    result.push(wholeArray.slice(0,midPoint))
                    result.push(wholeArray.slice(midPoint))
            }
            return result;
    }
        
        function merge(arr1, arr2){
                const result = [];
                let leftPointer = 0;
                let rightPointer = 0;
                while (leftPointer < arr1.length && rightPointer < arr2.length){
                    if (arr1[leftPointer] < arr2[rightPointer]){
                        result.push(arr1[leftPointer])
                        leftPointer++;
                }
                else {
                        result.push(arr2[rightPointer])
                        rightPointer++;
                }
        }
            if (leftPointer === arr1.length){
                    for (let i = rightPointer; i<arr2.length; i++){
                        result.push(arr2[i])
                }
        }
            else {
                    for (let i = leftPointer; i<arr1.length; i++){
                        result.push(arr1[i])
                }
        }
            return result;
    }
        
        function mergeSort(wholeArray) {
                if (wholeArray.length === 0 || wholeArray.length === 1) {
                    return wholeArray;
            }
            else {
                    const [first, second] = split(wholeArray)
                    return merge(
                        mergeSort(first),
                        mergeSort(second)
                    )
            }
    }
        const array = [10,9,8,7,6,5,4,3,2,1]
        mergeSort(array)
       ` ,
        binarySearch: `function binarySearch(array, target) {
                let left = 0;
                let right = array.length - 1
                while (left <= right) {
                    let middle = Math.floor((right + left) / 2)
                    if (array[middle] < target) {
                        left = middle + 1
                } else if (array[middle] > target) {
                        right = middle - 1
                } else {
                        return middle
                }
        }
            return -1
    }
        binarySearch([1,2,3,4,5,6,7,8,9,10], 7)
       ` ,
        threeLargest: `function findThreeLargestNumbers(array) {
                const nums = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
                for (let i = 0; i < array.length; i++) {
                    let num = array[i]
                    let j = nums.length - 1
                    while (j >= 0) {
                        if (num > nums[j]) {
                            let temp = nums[j]
                            nums[j] = num
                            num = temp
                    }
                    j--
            }
        }
            return nums
    }
        findThreeLargestNumbers([100,101, 1000, 10000, 1000000])
      `  ,
        fibonacci: `function getNthFib(n, cache = {}) {
                // Write your code here.
                if (n === 1) return 0;
                if (n === 2) return 1;
                if (n in cache) return cache[n]
                cache[n] = getNthFib(n - 1, cache) + getNthFib(n - 2, cache)
                return cache[n]
        }
        getNthFib(10)
       ` ,
        threeNumberSum: `function threeNumberSum(array, targetSum) {
                array = array.sort((a, b) => a > b)
                const triplets = []
                for (let i = 0; i < array.length - 1; i++) {
                    let num1 = array[i]
                    let diff = targetSum - num1
                    const hash = {}
                for (let j = array.length - 1; j > i; j--) {
                        let num = array[j]
                        if (typeof hash[num] === 'number') {
                            const triplet = [num1, num, hash[num]]
                            triplets.push(triplet)
                    }
                    if (typeof hash[diff - num] !== 'number') {
                            hash[diff - num] = num
                    }
            }
        }
            return triplets
    }
        threeNumberSum([1,2,3,4,5,6,7,8,9,10], 10)
       ` ,
        ceasarCypher: `function caesarCipherEncryptor(string, key) {
                const encryptedLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
                .reduce((acc, letter, i, self) => {
                        let idx = (i + key) % 26
                        acc[letter] = self[idx]
                        return acc
                }, {})
            let cipher = ''
            for (let i = 0; i < string.length; i++) {
                    cipher += encryptedLetters[string[i]]
            }
            return cipher
    }
        caesarCipherEncryptor('hello', 1)
        `,
        bubbleSort: `function bubbleSort(array) {
                let swapped = false
                for (let i = 0; i < array.length-1; i++) {
                    if (array[i] > array[i + 1]) {
                        swap(i, i + 1, array)
                        swapped = true
                }
        }
            return swapped ? bubbleSort(array) : array
    }
        function swap(i, j, arr) {
                let temp = arr[i]
                arr[i] = arr[j]
                arr[j] = temp
        }
        bubbleSort([5,4,3,2,1])
       ` ,
        fourNumberSum: `function fourNumberSum(array, targetSum) {
                const allPairSums = {}
            const quadruplets = []
            for (let i = 1; i < array.length; i++) {
                    for (let j = i + 1; j < array.length; j++) {
                        const currentSum = array[i] + array[j]
                        const difference = targetSum - currentSum
                        if (difference in allPairSums) {
                            for (const pair of allPairSums[difference]) {
                                quadruplets.push(pair.concat([array[i], array[j]]))
                        }
                }
            }
                for (let k = 0; k < i; k++) {
                        const currentSum = array[i] + array[k]
                        if (!(currentSum in allPairSums)) {
                            allPairSums[currentSum] = [[array[k], array[i]]]
                    } else {
                            allPairSums[currentSum].push([array[k], array[i]])
                    }
            }
        }
            return quadruplets
    }
        fourNumberSum([1,2,3,4,5,6,7,8,9,10, 0,0,0], 10)
        `,
        stack: `class MinMaxStack {
                constructor() {
                    this.mins = []
                    this.maxes = []
                    this.stack = []
            }
            peek() {
                    // Write your code here.
                    return this.stack[this.stack.length - 1]
            }
        
            pop() {
                    // Write your code here.
                this.mins.pop()
                this.maxes.pop()
                return this.stack.pop()
        }
        
            push(number) {
                    // Write your code here.
                this.stack.push(number)
                var k = number
                if (this.getMax() === undefined || number > this.getMax()) {
                        this.maxes.push(number)
            } else {
                        this.maxes.push(this.getMax())
            }
                if (this.getMin() === undefined || number < this.getMin()) {
                        this.mins.push(number)
            } else {
                        this.mins.push(this.getMin())
            }
        }
        
            getMin() {
                    // Write your code here.
                return this.mins[this.mins.length - 1]
        }
        
            getMax() {
                    // Write your code here.
                return this.maxes[this.maxes.length - 1]
        }
    }
        const stack = new MinMaxStack()
        stack.push(2);
      stack.push(0);
      stack.push(5);
      stack.push(4);
      stack.push(4);
      stack.push(11);
        stack.push(-11);
      stack.push(6);
        
        [stack.pop(), stack.pop(), stack.pop()]
      ` ,
        kadanes: `function kadanesAlgorithm(array) {
                  let max = -Infinity
                  let maxAtCurrent = 0
                  for(let i = 0; i < array.length; i++){
                      maxAtCurrent += array[i]
                      if(maxAtCurrent > max){
                          max = maxAtCurrent
                  }
                  if(maxAtCurrent < 0){
                          maxAtCurrent = 0
                  }
          }
              return max
      }
          kadanesAlgorithm([1,2,3,4,5])
          `,
        deepAccessor: `function access(obj){
                return obj[obj.name * obj[obj.x]]
        }
            const object = {
                    name: 2,
                    x: 3,
                    '3' : 30,
                '60': 'FOUND'
        }
            access(object)
    `    ,
        BST: `class BST {
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
       bst.insert(5).insert(15).insert(6).insert(2).insert(1).insert(22).insert(3).insert(1).insert(0).insert(4).insert(2).insert(5).insert(7).insert(90).insert(20).insert(540).insert(500)
        .insert(204).insert(205).insert(203).insert(550).insert(501).insert(500).insert(502).insert(700).insert(999).insert(600).insert(545).insert(549).insert(542)

`,
        riverSizes: `function riverSizes(matrix, rivers = []) {
                for (let i = 0; i < matrix.length; i++) {
                    for (let j = 0; j < matrix[i].length; j++) {
                        let riverlen = getContinuation(matrix, i, j)
                        if (riverlen) {
                            rivers.push(riverlen)
                    }
            }
        }
            return rivers
    }
        function getContinuation(matrix, i, j) {
                if (matrix[i] && matrix[i][j]) {
                    let riverlen = 1
                    matrix[i][j] = null
                    riverlen += getContinuation(matrix, i + 1, j)
                    riverlen += getContinuation(matrix, i, j + 1)
                    riverlen += getContinuation(matrix, i - 1, j)
                    riverlen += getContinuation(matrix, i, j - 1)
                    return riverlen
            }
            return 0
    }
        const matrix = [
                [1, null, null, 1, null, 1, null, null, 1, 1, 1, null],
            [1, null, 1, null, null, 1, 1, 1, 1, null, 1, null],
            [null, null, 1, null, 1, 1, null, 1, null, 1, 1, 1],
            [1, null, 1, null, 1, 1, null, null, null, 1, null, null],
            [1, null, 1, 1, null, null, null, 1, 1, 1, null, 1],
      ]
        const rivers = [];
        riverSizes(matrix, rivers)`,
        inPlaceMergeSort: `
        function merge(arr, start, mid, end) {
                let start2 = mid + 1
                if (arr[mid] <= arr[start2]) return
                while (start <= mid && start2 <= end) {
                    if (arr[start] <= arr[start2]) {
                        start++
                } else {
                        let value = arr[start2]
                        let index = start2
                        while (index !== start) {
                            arr[index] = arr[index - 1]
                            index--
                    }
                    arr[start] = value
                    start++
                    mid++
                    start2++
            }
        }
    }
        function mergeSort(arr, l, r) {
                if (l < r) {
                    let m = Math.floor((l + r) / 2)
                    mergeSort(arr, l, m)
                    mergeSort(arr, m + 1, r)
                    merge(arr, l, m, r)
            }
            return arr
    }
        const array = [20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]
        mergeSort(array, 0, array.length - 1)
    `
}