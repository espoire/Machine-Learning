
import { Network, xorTestConfig } from "./ann/Network.js";
import "./overrides/JsExtensions.js";
import { expose } from "./util/Util.js";

expose('Network', Network);
const network = new Network(xorTestConfig);
expose('network', network);

console.log('\n');
console.log('Instantiating Network from config:')
console.log(`new Network(${JSON.stringify(xorTestConfig)})`);

console.log('\n');
console.log('Test: Should mimic an XOR gate. Expected outputs: 0, 1, 1, 0.');
console.log('network.run([0, 0])', network.run([0, 0]));
console.log('network.run([0, 1])', network.run([0, 1]));
console.log('network.run([1, 0])', network.run([1, 0]));
console.log('network.run([1, 1])', network.run([1, 1]));

console.log('\n');
console.log('Test: network.toJson() should match the input config.');
console.log('JSON.stringify(Input config):', JSON.stringify(xorTestConfig));
console.log('network.toJson():            ', network.toJson());
console.log('Matches?', (JSON.stringify(xorTestConfig) === network.toJson()));