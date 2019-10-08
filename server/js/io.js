// const ls = spawn(
//     `docker`,
//     ['stats',
//         '--all',
//         '--format',
//         `{\"container\":\"{{ .Container }}\",\"memory\":{\"raw\":\"{{ .MemUsage }}\",\"percent\":\"{{ .MemPerc }}\"},\"cpu\":\"{{ .CPUPerc }}\"}`
//     ])


// const logs = []

// ls.stdout.on('data', (data) => {
//     // console.log(data.toString().trim());

//     try {
//         const str = data.toString()
//         if (str[1] === '"') logs.push(str.slice(0, str.length - 1))
//     } catch (e) {
//     }

// })
// ls.stderr.on('data', (data) => {
//     console.log(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//     console.log(`child process exited with code ${code}`);
// });


// process.on('SIGINT', () => {
//     console.log(logs.map((l) => {
//         return JSON.parse(l)
//     }))
// })

