export default function sample(generatorFn, domain = [0, 1], range = [0,1], samples = 1000) {
  const ret = [];
  
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    const x = domain[0] + u * (domain[1] - domain[0]);
    const y = generatorFn(x);
    const v = (y - range[0]) / (range[1] - range[0]);
    ret.push(v);
  }

  return ret;
}