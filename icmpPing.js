var icmpPing = require("ping");

let packetCount = 0;
let lostPacketCount = 0;
let receivedPacketCount = 0;
let minTime = Number.MAX_SAFE_INTEGER;
let maxTime = 0;
let sumTime = 0;

const ping = (hostname) => {
  const interval = setInterval(() => {
    connect(hostname);
  }, 1000);

  const stop = () => {
    clearInterval(interval);
    return {
      packetCount,
      receivedPacketCount,
      lostPacketCount: packetCount - receivedPacketCount,
      minTime: sumTime !== 0 ? minTime : 0.0,
      maxTime,
      avgTime:
        receivedPacketCount > 0 ? parseInt(sumTime / receivedPacketCount) : 0.0,
    };
  };
  return {
    stop,
  };
};

const connect = (hostname) => {
  packetCount++;
  icmpPing.promise.probe(hostname).then(function (res) {
    const time = res.time;
    if (Number.isInteger(time)) {
      receivedPacketCount++;
      minTime = Math.min(minTime, time);
      maxTime = Math.max(maxTime, time);
      sumTime += time;
    } else {
      lostPacketCount++;
    }
  });
};

module.exports = {
  ping,
};
