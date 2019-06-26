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
    `,
    mergeSort: `function mergeSort(arr) {
        if (arr.length < 2) {
            return arr
        }
       const [firstHalf, secondHalf] = split(arr)
       return merge(mergeSort(firstHalf), mergeSort(secondHalf))
    }
    function split(arr) {
        const splitIdx = Math.floor(arr.length / 2)
        const firstHalf = arr.slice(0, splitIdx)
        const secondHalf = arr.slice(splitIdx, arr.length)
        return [firstHalf, secondHalf]
    }
    function merge(arr1, arr2) {
        let i = 0
        while (arr2.length>0) {
            const num = arr2.shift()
            while (num > arr1[i] && i < arr1.length) {
                i++
            }
            arr1.splice(i, 0, num)
        }
        return arr1
    }
    mergeSort([5,4,3,2,1])
    `,
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
    `,
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
    `,
    fibonacci: `function getNthFib(n, cache = {}) {
        // Write your code here.
        if (n === 1) return 0;
        if (n === 2) return 1;
        if (n in cache) return cache[n]
        cache[n] = getNthFib(n - 1, cache) + getNthFib(n - 2, cache)
        return cache[n]
    }
    getNthFib(10)
    `,
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
    `,
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
    `,
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
    `,
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
    `,
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

    new BST(100).insert(5).insert(15).insert(5).insert(2).insert(1).insert(22)
        .insert(1).insert(1).insert(3).insert(1).insert(1).insert(502).insert(55000)
        .insert(204).insert(205).insert(207).insert(206).insert(208).insert(203);`
}