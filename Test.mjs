import { Network, xorTestConfig } from "./ann/Network.mjs";

export default function test() {
  const xorNetwork = new Network(xorTestConfig);
  console.log('\n');
  console.log('xorNetwork', xorNetwork);

  console.log('\n');
  console.log('Instantiating Network from config:');
  console.log(`new Network(${JSON.stringify(xorTestConfig)})`);

  console.log('\n');
  console.log('Test: Should mimic an XOR gate. Expected outputs: 0, 1, 1, 0.');
  console.log('xorNetwork.run([0, 0])', xorNetwork.run([0, 0]));
  console.log('xorNetwork.run([0, 1])', xorNetwork.run([0, 1]));
  console.log('xorNetwork.run([1, 0])', xorNetwork.run([1, 0]));
  console.log('xorNetwork.run([1, 1])', xorNetwork.run([1, 1]));

  console.log('\n');
  console.log('Test: xorNetwork.toJson() should match the input config.');
  console.log('JSON.stringify(Input config):', JSON.stringify(xorTestConfig));
  console.log('xorNetwork.toJson():            ', xorNetwork.toJson());
  console.log('Matches?', (JSON.stringify(xorTestConfig) === xorNetwork.toJson()));


  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  console.log('\n');
  console.log('Instantiating Network with random weights:');
  const trainingTestNetwork = new Network({
    inputs: 2,
    layers: [
      [
        [random(-1, 1), random(-1, 1)],
        [random(-1, 1), random(-1, 1)],
      ],
      [random(-1, 1), random(-1, 1)]
    ],
  });

  console.log('\n');
  console.log('Test: trainingTestNetwork.toJson() to expose weights for visual inspection.');
  console.log('trainingTestNetwork.toJson(): ', trainingTestNetwork.toJson());

  console.log('\n');
  console.log('Test: Should be random nonsense. Desired outputs: 0, 1, 0, 1.');
  console.log('trainingTestNetwork.run([0, 0])', trainingTestNetwork.run([0, 0]));
  console.log('trainingTestNetwork.run([0, 1])', trainingTestNetwork.run([0, 1]));
  console.log('trainingTestNetwork.run([1, 0])', trainingTestNetwork.run([1, 0]));
  console.log('trainingTestNetwork.run([1, 1])', trainingTestNetwork.run([1, 1]));

  console.log('\n');
  console.log('Training...');
  console.log(
    trainingTestNetwork.train([
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [0] },
      { inputs: [1, 1], outputs: [1] },
    ])
  );

  console.log('\n');
  console.log('Test. Expected outputs: 0, 1, 0, 1.');
  console.log('trainingTestNetwork.run([0, 0])', trainingTestNetwork.run([0, 0]));
  console.log('trainingTestNetwork.run([0, 1])', trainingTestNetwork.run([0, 1]));
  console.log('trainingTestNetwork.run([1, 0])', trainingTestNetwork.run([1, 0]));
  console.log('trainingTestNetwork.run([1, 1])', trainingTestNetwork.run([1, 1]));

  console.log('\n');
  console.log('Test: trainingTestNetwork.toJson() to expose weights for visual inspection.');
  console.log('trainingTestNetwork.toJson(): ', trainingTestNetwork.toJson());
}