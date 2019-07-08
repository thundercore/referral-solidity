const web3 = require('web3');
const BN = web3.utils.BN;

Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + days);
  return this;
}

Date.prototype.addHours = function(hours) {
  this.setHours(this.getHours() + hours);
  return this;
}

Date.prototype.addSeconds = function(seconds) {
  this.setSeconds(this.getSeconds() + seconds);
  return this;
}

Date.prototype.getTimeAsSeconds = function() {
  return Math.floor(this.getTime() / 1000);
}

Date.prototype.getTimeAsBN = function() {
  return new BN(this.getTimeAsSeconds());
}
