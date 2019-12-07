import { delayedHello } from './DelayedHello';
 
console.log("Hello world!");

async function asyncWrapper() {
  const hello = await delayedHello("delayed");
  console.log(hello)
}

asyncWrapper();
