var SurrealObject = (function () {

  // Helpers to fetch either the left or right "half" of a number.
  var L = function(n) {
    return n.left;
  };
  var R = function(n) {
    return n.right;
  };

  var isEmptyObject = function(value) {
    return Boolean(value && typeof value == 'object') && !Object.keys(value).length;
  };

  // Used in determining the "size" of a half, to evaluate sign.
  var size = function(n) {
    var i = 0;
    while (n = n.left) {
      i++;
    }
    return i;
  };

  // Recursively flip the halves of a number, to switch its sign
  var flip = function(n) {
    if (isEmptyObject(n)) {
      return n;
    }
    return {left:flip(n.right), right:flip(n.left)};
  };

  // Construct a new surreal number by passing in either:
  //   - a real
  //   - nothing
  //   - a hash (surreal.value for some previously defined surreal)
  //   - a previously defined surreal object.
  SurrealObject = function (input) {
    if (typeof input == 'number') {
      this.value = SurrealObject.fromReal(input);
    } else if (! input || ! input.constructor) {
      // Nothing to do.
    } else if ('object' === typeof input && 'undefined' !== typeof input.left && 'undefined' !== typeof input.right) {
      this.value = input;
    } else if (input.isSurrealObject) {
      this.value = input.value;
    }
  };

  SurrealObject.prototype.isSurrealObject = true;

  // On the first day, Conway created Zero.
  SurrealObject.zero = function () {
    return {left:{}, right:{}};
  };

  SurrealObject.prototype.isZero = function () {
    return isEmptyObject(L(this.value)) && isEmptyObject(R(this.value));
  };

  SurrealObject.prototype.increment = function () {
    this.value = this.successor().value;
  };

  SurrealObject.prototype.decrement = function () {
    this.value = this.predecessor().value;
  };

  SurrealObject.prototype.successor = function () {
    //return new SurrealObject([this.value, []]);
    var n;
    if (this.isZero() || this.isPositive()) {
      n = new SurrealObject({left:this.value, right:{}});
    } else if (this.isNegative()) {
      n = new SurrealObject(R(this.value));
    }
    return n;
  };

  SurrealObject.prototype.predecessor = function () {
    var n;
    if (this.isZero() || this.isNegative()) {
      n = new SurrealObject({left:{}, right:this.value});
    } else if (this.isPositive()) {
      return new SurrealObject(L(this.value));
    }
    return n;
  };


  // Comparisons.

  SurrealObject.prototype.isEqualTo = function (other) {
    return this.isLessThanOrEqualTo(other) && this.isGreaterThanOrEqualTo(other);
  };

  SurrealObject.prototype.isPositive = function () {
    return (size(L(this.value)) > size(R(this.value)));
  };

  SurrealObject.prototype.isNegative = function () {
    return (! this.isPositive()) && (! this.isZero());
  };

  SurrealObject.prototype.isLessThanOrEqualTo = function (other) {
    var first = new SurrealObject(this);
    var second = new SurrealObject(other);
    if ((first.isNegative() || first.isZero()) && (second.isPositive() || second.isZero())) {
      return true;
    } else if ((first.isPositive() || first.isZero()) && (second.isNegative() || second.isZero())) {
      return false;
    } else if (first.isPositive() && second.isPositive()) {
      // Race to the bottom.
      while(! first.isZero() && ! second.isZero()) {
        first.decrement();
        second.decrement();
      }
      return first.isZero();
    } else if (first.isNegative() && second.isNegative()) {
      // Race to the top.
      while (! first.isZero() && ! second.isZero()) {
        first.increment();
        second.increment();
      }
      return second.isZero();
    } else {
      throw "Unhandled surreal comparison";
    }
  };

  SurrealObject.prototype.isLessThan = function (other) {
    return ! this.isGreaterThanOrEqualTo(other);
  };

  SurrealObject.prototype.isGreaterThanOrEqualTo = function (other) {
    return other.isLessThanOrEqualTo(this);
  };

  SurrealObject.prototype.isGreaterThan = function (other) {
    return ! this.isLessThanOrEqualTo(other);
  };


  // Operations. All operations are immutable and return new SurrealObject objects.

  SurrealObject.prototype.negate = function () {
    return new SurrealObject(flip(this.value));
  };

  SurrealObject.prototype.add = function (other) {
    var first = new SurrealObject(this);
    var second = new SurrealObject(other);
    var isPositive = second.isPositive();
    var firstAlter = isPositive ? 'increment' : 'decrement';
    var secondAlter = isPositive ? 'decrement' : 'increment';
    if (! second.isZero()) {
      while (! second.isZero()) {
        first[firstAlter]();
        second[secondAlter]();
      }
    }
    return first;
  };

  SurrealObject.prototype.subtract = function (other) {
    return (new SurrealObject(other)).negate().add(this);
  };

  SurrealObject.prototype.multiply = function (other) {
    var first = this;
    var second = new SurrealObject(other);
    if (first.isZero() || second.isZero()) {
      return new SurrealObject(SurrealObject.zero());
    }
    var isPositive = second.isPositive();
    var alter = isPositive ? 'decrement' : 'increment';
    second[alter]();
    while (! second.isZero()) {
      first = first.add(this);
      second[alter]();
    }
    return isPositive ? first : first.negate();
  };

  SurrealObject.prototype.divide = function (other) {
    var first = new SurrealObject(this);
    var second = new SurrealObject(other);
    var iter = new SurrealObject(SurrealObject.zero());
    var count = new SurrealObject(SurrealObject.zero());
    if (first.isZero()) {
      return count;
    }
    if (second.isZero()) {
      throw 'Divide by zero error';
    }
    var negateResult = (first.isPositive() && second.isNegative()) || (first.isNegative() && second.isPositive());
    if (first.isNegative()) {
      first = first.negate();
    }
    if (second.isNegative()) {
      second = second.negate();
    }
    while (first.isGreaterThan(iter)) {
      iter = iter.add(second);
      count.increment();
    }
    if (first.isEqualTo(iter)) {
      return negateResult ? count.negate() : count;
    }
    // Not a neat division. It's in the Too Hard Basket for now.
    throw 'Fractions are hard';
  };


  // Conversions.

  SurrealObject.fromReal = function (real) {
    var surreal = new SurrealObject(SurrealObject.zero());
    if (real === 0) {
      return surreal.value;
    } else if (real > 0) {
      for (var i = 0; i < real; i++) {
        surreal.increment();
      }
    } else if (real < 0) {
      for (var i = 0; i > real; i--) {
        surreal.decrement();
      }
    }
    return surreal.value;
  };

  SurrealObject.prototype.toReal = function () {
    var n = new SurrealObject(this);
    var i = 0;
    if (n.isNegative()) {
      while (! n.isZero()) {
        n.increment();
        i--;
      }
    } else {
      while (! n.isZero()) {
        n.decrement();
        i++;
      }
    }
    return i;
  };

  SurrealObject.prototype.valueOf = SurrealObject.prototype.toReal;

  SurrealObject.prototype.toString = function () {
    var walk = function (n) {
      if (isEmptyObject(n)) {
        return '{}';
      }
      return '{' + walk(n.left) + ', ' + walk(n.right) + '}';
    };
    return walk(this.value);
  };

  return SurrealObject;

})();
