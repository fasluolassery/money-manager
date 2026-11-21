// Used only by dependency-cruiser to parse TypeScript source files.
// TypeScript 7.0 is not yet supported by dependency-cruiser's TS API
// (supported range: >=2.0.0 <7.0.0||>=7.1.0); Babel fills the gap.
module.exports = {
  presets: [["@babel/preset-typescript", { allExtensions: true, isTSX: true }]],
};
