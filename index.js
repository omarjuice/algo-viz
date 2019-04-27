const step = require('./stepify')
const code = `function twoNumberSum(array, targetSum) {
	const hash = {}
	for(let number of array){
		if(hash[number]){
			return number > hash[number] ? [hash[number], number] : [number, hash[number]]
		}
		hash[targetSum - number] = number;
	}
	return []
}

`

console.log(step(code))
