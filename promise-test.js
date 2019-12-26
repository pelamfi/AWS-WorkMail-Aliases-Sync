
function start(timeout) {
    return new Promise((resolve, reject) => {
        console.log(`start ${timeout}`);
        setTimeout(() => { console.log(`resolve ${timeout}`); resolve(`resolve ${timeout}`) }, timeout);
    });
}

/*
start(3000)
    .then(() => start(2000))
    .then(() => start(1000))
    .then(() => console.log("final then executed"))
*/

start(3000)
    .then(start(2000))
    .then(start(1000))
    .then(() => console.log("final then executed"))

