const step = require('./stepify')
const twoNumberSum = `function twoNumberSum(array, targetSum) {
	const hash = {}
	for(let i = 0; i<array.length; i++){
        const number = array[i]
		if(hash[number]){
			return number > hash[number] ? [hash[number], number] : [number, hash[number]]
		}
		hash[targetSum - number] = number;
	}
	return []
}
twoNumberSum([1,2], 3)
`
const mergeSort = `function mergeSort(arr) {
    if (arr.length < 2) {
        return arr
    }
   const newArr = split(arr)
   const firstHalf = newArr[0]
   const secondHalf = newArr[1]
   const sorted1 = mergeSort(firstHalf)
   const sorted2 = mergeSort(secondHalf)
    const sorted = merge(sorted1, sorted2)
    return sorted
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
mergeSort([5,4,3,2,1])`

const binarySearch = `function binarySearch(array, target) {
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
binarySearch([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18], 13)
`

const objectAccessor = `function hello(){
    return hash[obj].cool[target - num].some[1 + hello() + 1]
    while(obj[i++]){
        console.log("Hello")
    }
}
hello["goodbye" + "e"] = 'bye';
`

console.log(step(objectAccessor))
