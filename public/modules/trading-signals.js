var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/big.js/big.mjs
var DP = 20;
var RM = 1;
var MAX_DP = 1e6;
var MAX_POWER = 1e6;
var NE = -7;
var PE = 21;
var STRICT = false;
var NAME = "[big.js] ";
var INVALID = NAME + "Invalid ";
var INVALID_DP = INVALID + "decimal places";
var INVALID_RM = INVALID + "rounding mode";
var DIV_BY_ZERO = NAME + "Division by zero";
var P = {};
var UNDEFINED = void 0;
var NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
function _Big_() {
  function Big2(n) {
    var x = this;
    if (!(x instanceof Big2))
      return n === UNDEFINED ? _Big_() : new Big2(n);
    if (n instanceof Big2) {
      x.s = n.s;
      x.e = n.e;
      x.c = n.c.slice();
    } else {
      if (typeof n !== "string") {
        if (Big2.strict === true && typeof n !== "bigint") {
          throw TypeError(INVALID + "value");
        }
        n = n === 0 && 1 / n < 0 ? "-0" : String(n);
      }
      parse(x, n);
    }
    x.constructor = Big2;
  }
  Big2.prototype = P;
  Big2.DP = DP;
  Big2.RM = RM;
  Big2.NE = NE;
  Big2.PE = PE;
  Big2.strict = STRICT;
  Big2.roundDown = 0;
  Big2.roundHalfUp = 1;
  Big2.roundHalfEven = 2;
  Big2.roundUp = 3;
  return Big2;
}
function parse(x, n) {
  var e, i, nl;
  if (!NUMERIC.test(n)) {
    throw Error(INVALID + "number");
  }
  x.s = n.charAt(0) == "-" ? (n = n.slice(1), -1) : 1;
  if ((e = n.indexOf(".")) > -1)
    n = n.replace(".", "");
  if ((i = n.search(/e/i)) > 0) {
    if (e < 0)
      e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {
    e = n.length;
  }
  nl = n.length;
  for (i = 0; i < nl && n.charAt(i) == "0"; )
    ++i;
  if (i == nl) {
    x.c = [x.e = 0];
  } else {
    for (; nl > 0 && n.charAt(--nl) == "0"; )
      ;
    x.e = e - i - 1;
    x.c = [];
    for (e = 0; i <= nl; )
      x.c[e++] = +n.charAt(i++);
  }
  return x;
}
function round(x, sd, rm, more) {
  var xc = x.c;
  if (rm === UNDEFINED)
    rm = x.constructor.RM;
  if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
    throw Error(INVALID_RM);
  }
  if (sd < 1) {
    more = rm === 3 && (more || !!xc[0]) || sd === 0 && (rm === 1 && xc[0] >= 5 || rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED)));
    xc.length = 1;
    if (more) {
      x.e = x.e - sd + 1;
      xc[0] = 1;
    } else {
      xc[0] = x.e = 0;
    }
  } else if (sd < xc.length) {
    more = rm === 1 && xc[sd] >= 5 || rm === 2 && (xc[sd] > 5 || xc[sd] === 5 && (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) || rm === 3 && (more || !!xc[0]);
    xc.length = sd;
    if (more) {
      for (; ++xc[--sd] > 9; ) {
        xc[sd] = 0;
        if (sd === 0) {
          ++x.e;
          xc.unshift(1);
          break;
        }
      }
    }
    for (sd = xc.length; !xc[--sd]; )
      xc.pop();
  }
  return x;
}
function stringify(x, doExponential, isNonzero) {
  var e = x.e, s = x.c.join(""), n = s.length;
  if (doExponential) {
    s = s.charAt(0) + (n > 1 ? "." + s.slice(1) : "") + (e < 0 ? "e" : "e+") + e;
  } else if (e < 0) {
    for (; ++e; )
      s = "0" + s;
    s = "0." + s;
  } else if (e > 0) {
    if (++e > n) {
      for (e -= n; e--; )
        s += "0";
    } else if (e < n) {
      s = s.slice(0, e) + "." + s.slice(e);
    }
  } else if (n > 1) {
    s = s.charAt(0) + "." + s.slice(1);
  }
  return x.s < 0 && isNonzero ? "-" + s : s;
}
P.abs = function() {
  var x = new this.constructor(this);
  x.s = 1;
  return x;
};
P.cmp = function(y) {
  var isneg, x = this, xc = x.c, yc = (y = new x.constructor(y)).c, i = x.s, j = y.s, k = x.e, l = y.e;
  if (!xc[0] || !yc[0])
    return !xc[0] ? !yc[0] ? 0 : -j : i;
  if (i != j)
    return i;
  isneg = i < 0;
  if (k != l)
    return k > l ^ isneg ? 1 : -1;
  j = (k = xc.length) < (l = yc.length) ? k : l;
  for (i = -1; ++i < j; ) {
    if (xc[i] != yc[i])
      return xc[i] > yc[i] ^ isneg ? 1 : -1;
  }
  return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};
P.div = function(y) {
  var x = this, Big2 = x.constructor, a = x.c, b = (y = new Big2(y)).c, k = x.s == y.s ? 1 : -1, dp = Big2.DP;
  if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }
  if (!b[0]) {
    throw Error(DIV_BY_ZERO);
  }
  if (!a[0]) {
    y.s = k;
    y.c = [y.e = 0];
    return y;
  }
  var bl, bt, n, cmp, ri, bz = b.slice(), ai = bl = b.length, al = a.length, r = a.slice(0, bl), rl = r.length, q = y, qc = q.c = [], qi = 0, p = dp + (q.e = x.e - y.e) + 1;
  q.s = k;
  k = p < 0 ? 0 : p;
  bz.unshift(0);
  for (; rl++ < bl; )
    r.push(0);
  do {
    for (n = 0; n < 10; n++) {
      if (bl != (rl = r.length)) {
        cmp = bl > rl ? 1 : -1;
      } else {
        for (ri = -1, cmp = 0; ++ri < bl; ) {
          if (b[ri] != r[ri]) {
            cmp = b[ri] > r[ri] ? 1 : -1;
            break;
          }
        }
      }
      if (cmp < 0) {
        for (bt = rl == bl ? b : bz; rl; ) {
          if (r[--rl] < bt[rl]) {
            ri = rl;
            for (; ri && !r[--ri]; )
              r[ri] = 9;
            --r[ri];
            r[rl] += 10;
          }
          r[rl] -= bt[rl];
        }
        for (; !r[0]; )
          r.shift();
      } else {
        break;
      }
    }
    qc[qi++] = cmp ? n : ++n;
    if (r[0] && cmp)
      r[rl] = a[ai] || 0;
    else
      r = [a[ai]];
  } while ((ai++ < al || r[0] !== UNDEFINED) && k--);
  if (!qc[0] && qi != 1) {
    qc.shift();
    q.e--;
    p--;
  }
  if (qi > p)
    round(q, p, Big2.RM, r[0] !== UNDEFINED);
  return q;
};
P.eq = function(y) {
  return this.cmp(y) === 0;
};
P.gt = function(y) {
  return this.cmp(y) > 0;
};
P.gte = function(y) {
  return this.cmp(y) > -1;
};
P.lt = function(y) {
  return this.cmp(y) < 0;
};
P.lte = function(y) {
  return this.cmp(y) < 1;
};
P.minus = P.sub = function(y) {
  var i, j, t, xlty, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
  if (a != b) {
    y.s = -b;
    return x.plus(y);
  }
  var xc = x.c.slice(), xe = x.e, yc = y.c, ye = y.e;
  if (!xc[0] || !yc[0]) {
    if (yc[0]) {
      y.s = -b;
    } else if (xc[0]) {
      y = new Big2(x);
    } else {
      y.s = 1;
    }
    return y;
  }
  if (a = xe - ye) {
    if (xlty = a < 0) {
      a = -a;
      t = xc;
    } else {
      ye = xe;
      t = yc;
    }
    t.reverse();
    for (b = a; b--; )
      t.push(0);
    t.reverse();
  } else {
    j = ((xlty = xc.length < yc.length) ? xc : yc).length;
    for (a = b = 0; b < j; b++) {
      if (xc[b] != yc[b]) {
        xlty = xc[b] < yc[b];
        break;
      }
    }
  }
  if (xlty) {
    t = xc;
    xc = yc;
    yc = t;
    y.s = -y.s;
  }
  if ((b = (j = yc.length) - (i = xc.length)) > 0)
    for (; b--; )
      xc[i++] = 0;
  for (b = i; j > a; ) {
    if (xc[--j] < yc[j]) {
      for (i = j; i && !xc[--i]; )
        xc[i] = 9;
      --xc[i];
      xc[j] += 10;
    }
    xc[j] -= yc[j];
  }
  for (; xc[--b] === 0; )
    xc.pop();
  for (; xc[0] === 0; ) {
    xc.shift();
    --ye;
  }
  if (!xc[0]) {
    y.s = 1;
    xc = [ye = 0];
  }
  y.c = xc;
  y.e = ye;
  return y;
};
P.mod = function(y) {
  var ygtx, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
  if (!y.c[0]) {
    throw Error(DIV_BY_ZERO);
  }
  x.s = y.s = 1;
  ygtx = y.cmp(x) == 1;
  x.s = a;
  y.s = b;
  if (ygtx)
    return new Big2(x);
  a = Big2.DP;
  b = Big2.RM;
  Big2.DP = Big2.RM = 0;
  x = x.div(y);
  Big2.DP = a;
  Big2.RM = b;
  return this.minus(x.times(y));
};
P.neg = function() {
  var x = new this.constructor(this);
  x.s = -x.s;
  return x;
};
P.plus = P.add = function(y) {
  var e, k, t, x = this, Big2 = x.constructor;
  y = new Big2(y);
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }
  var xe = x.e, xc = x.c, ye = y.e, yc = y.c;
  if (!xc[0] || !yc[0]) {
    if (!yc[0]) {
      if (xc[0]) {
        y = new Big2(x);
      } else {
        y.s = x.s;
      }
    }
    return y;
  }
  xc = xc.slice();
  if (e = xe - ye) {
    if (e > 0) {
      ye = xe;
      t = yc;
    } else {
      e = -e;
      t = xc;
    }
    t.reverse();
    for (; e--; )
      t.push(0);
    t.reverse();
  }
  if (xc.length - yc.length < 0) {
    t = yc;
    yc = xc;
    xc = t;
  }
  e = yc.length;
  for (k = 0; e; xc[e] %= 10)
    k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;
  if (k) {
    xc.unshift(k);
    ++ye;
  }
  for (e = xc.length; xc[--e] === 0; )
    xc.pop();
  y.c = xc;
  y.e = ye;
  return y;
};
P.pow = function(n) {
  var x = this, one = new x.constructor("1"), y = one, isneg = n < 0;
  if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
    throw Error(INVALID + "exponent");
  }
  if (isneg)
    n = -n;
  for (; ; ) {
    if (n & 1)
      y = y.times(x);
    n >>= 1;
    if (!n)
      break;
    x = x.times(x);
  }
  return isneg ? one.div(y) : y;
};
P.prec = function(sd, rm) {
  if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
    throw Error(INVALID + "precision");
  }
  return round(new this.constructor(this), sd, rm);
};
P.round = function(dp, rm) {
  if (dp === UNDEFINED)
    dp = 0;
  else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }
  return round(new this.constructor(this), dp + this.e + 1, rm);
};
P.sqrt = function() {
  var r, c, t, x = this, Big2 = x.constructor, s = x.s, e = x.e, half = new Big2("0.5");
  if (!x.c[0])
    return new Big2(x);
  if (s < 0) {
    throw Error(NAME + "No square root");
  }
  s = Math.sqrt(x + "");
  if (s === 0 || s === 1 / 0) {
    c = x.c.join("");
    if (!(c.length + e & 1))
      c += "0";
    s = Math.sqrt(c);
    e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
    r = new Big2((s == 1 / 0 ? "5e" : (s = s.toExponential()).slice(0, s.indexOf("e") + 1)) + e);
  } else {
    r = new Big2(s + "");
  }
  e = r.e + (Big2.DP += 4);
  do {
    t = r;
    r = half.times(t.plus(x.div(t)));
  } while (t.c.slice(0, e).join("") !== r.c.slice(0, e).join(""));
  return round(r, (Big2.DP -= 4) + r.e + 1, Big2.RM);
};
P.times = P.mul = function(y) {
  var c, x = this, Big2 = x.constructor, xc = x.c, yc = (y = new Big2(y)).c, a = xc.length, b = yc.length, i = x.e, j = y.e;
  y.s = x.s == y.s ? 1 : -1;
  if (!xc[0] || !yc[0]) {
    y.c = [y.e = 0];
    return y;
  }
  y.e = i + j;
  if (a < b) {
    c = xc;
    xc = yc;
    yc = c;
    j = a;
    a = b;
    b = j;
  }
  for (c = new Array(j = a + b); j--; )
    c[j] = 0;
  for (i = b; i--; ) {
    b = 0;
    for (j = a + i; j > i; ) {
      b = c[j] + yc[i] * xc[j - i - 1] + b;
      c[j--] = b % 10;
      b = b / 10 | 0;
    }
    c[j] = b;
  }
  if (b)
    ++y.e;
  else
    c.shift();
  for (i = c.length; !c[--i]; )
    c.pop();
  y.c = c;
  return y;
};
P.toExponential = function(dp, rm) {
  var x = this, n = x.c[0];
  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), ++dp, rm);
    for (; x.c.length < dp; )
      x.c.push(0);
  }
  return stringify(x, true, !!n);
};
P.toFixed = function(dp, rm) {
  var x = this, n = x.c[0];
  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), dp + x.e + 1, rm);
    for (dp = dp + x.e + 1; x.c.length < dp; )
      x.c.push(0);
  }
  return stringify(x, false, !!n);
};
P[Symbol.for("nodejs.util.inspect.custom")] = P.toJSON = P.toString = function() {
  var x = this, Big2 = x.constructor;
  return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, !!x.c[0]);
};
P.toNumber = function() {
  var n = Number(stringify(this, true, true));
  if (this.constructor.strict === true && !this.eq(n.toString())) {
    throw Error(NAME + "Imprecise conversion");
  }
  return n;
};
P.toPrecision = function(sd, rm) {
  var x = this, Big2 = x.constructor, n = x.c[0];
  if (sd !== UNDEFINED) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + "precision");
    }
    x = round(new Big2(x), sd, rm);
    for (; x.c.length < sd; )
      x.c.push(0);
  }
  return stringify(x, sd <= x.e || x.e <= Big2.NE || x.e >= Big2.PE, !!n);
};
P.valueOf = function() {
  var x = this, Big2 = x.constructor;
  if (Big2.strict === true) {
    throw Error(NAME + "valueOf disallowed");
  }
  return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, true);
};
var Big = _Big_();
var big_default = Big;

// node_modules/trading-signals/dist/error/NotEnoughDataError.js
var NotEnoughDataError = class extends Error {
  constructor(message = "Not enough data") {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "NotEnoughDataError";
  }
};

// node_modules/trading-signals/dist/Indicator.js
var BigIndicatorSeries = class {
  constructor() {
    __publicField(this, "highest");
    __publicField(this, "lowest");
    __publicField(this, "result");
  }
  get isStable() {
    return this.result !== void 0;
  }
  getResult() {
    if (this.result === void 0) {
      throw new NotEnoughDataError();
    }
    return this.result;
  }
  setResult(value) {
    if (this.highest === void 0 || value.gt(this.highest)) {
      this.highest = value;
    }
    if (this.lowest === void 0 || value.lt(this.lowest)) {
      this.lowest = value;
    }
    return this.result = value;
  }
};

// node_modules/trading-signals/dist/MA/MovingAverage.js
var MovingAverage = class extends BigIndicatorSeries {
  constructor(interval) {
    super();
    __publicField(this, "interval");
    this.interval = interval;
  }
  updates(prices) {
    prices.forEach((price) => this.update(price));
    return this.result;
  }
};

// node_modules/trading-signals/dist/SMA/SMA.js
var SMA = class _SMA extends MovingAverage {
  constructor() {
    super(...arguments);
    __publicField(this, "prices", []);
  }
  update(price) {
    this.prices.push(price);
    if (this.prices.length > this.interval) {
      this.prices.shift();
    }
    if (this.prices.length === this.interval) {
      return this.setResult(_SMA.getResultFromBatch(this.prices));
    }
  }
  static getResultFromBatch(prices) {
    const sum = prices.reduce((a, b) => a.plus(b), new big_default("0"));
    return sum.div(prices.length || 1);
  }
};

// node_modules/trading-signals/dist/EMA/EMA.js
var EMA = class extends MovingAverage {
  constructor(interval) {
    super(interval);
    __publicField(this, "interval");
    __publicField(this, "pricesCounter", 0);
    __publicField(this, "weightFactor");
    this.interval = interval;
    this.weightFactor = 2 / (this.interval + 1);
  }
  update(_price) {
    this.pricesCounter++;
    const price = new big_default(_price);
    if (this.result === void 0) {
      this.result = price;
    }
    return this.setResult(price.times(this.weightFactor).add(this.result.times(1 - this.weightFactor)));
  }
  getResult() {
    if (this.pricesCounter < this.interval) {
      throw new NotEnoughDataError();
    }
    return this.result;
  }
  get isStable() {
    try {
      this.getResult();
      return true;
    } catch (e) {
      return false;
    }
  }
};

// node_modules/trading-signals/dist/MACD/MACD.js
var MACD = class {
  constructor(config) {
    __publicField(this, "prices", []);
    __publicField(this, "long");
    __publicField(this, "short");
    __publicField(this, "signal");
    __publicField(this, "result");
    this.long = new config.indicator(config.longInterval);
    this.short = new config.indicator(config.shortInterval);
    this.signal = new config.indicator(config.signalInterval);
  }
  get isStable() {
    return this.result !== void 0;
  }
  update(_price) {
    const price = new big_default(_price);
    this.prices.push(price);
    const short = this.short.update(price);
    const long = this.long.update(price);
    if (this.prices.length > this.long.interval) {
      this.prices.shift();
    }
    if (this.prices.length === this.long.interval) {
      const macd = short.sub(long);
      const signal = this.signal.update(macd);
      return this.result = {
        histogram: macd.sub(signal),
        macd,
        signal
      };
    }
  }
  getResult() {
    if (!this.isStable || this.result === void 0) {
      throw new NotEnoughDataError();
    }
    return this.result;
  }
};
export {
  big_default as Big,
  EMA,
  MACD,
  SMA
};
