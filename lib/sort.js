module.exports = {
  ascending: ascending,
  descending: descending
};

function ascending(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

function descending(a, b) {
  return a > b ? -1 : a < b ? 1 : 0;
}
