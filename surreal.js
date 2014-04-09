var Surreal = (function () {

  // Helpers to fetch either the left or right "half" of a number.
  var L = function(n) {
    return n.value[0];
  }
  var R = function(n) {
    return n.value[1];
  }

  // Used in determining the "size" of a half, to evaluate sign.
  var size = function(n) {
    var i = 0;
    while (n = n[0]) {
      i++;
    }
    return i;
  }

  // Construct a new surreal number by passing in either:
  //   - a real
  //   - nothing
  //   - an array of arrays (surreal.value for some previously defined surreal)
  //   - a previously defined surreal object.
  Surreal = function (input) {
    if (typeof input == 'number') {
      this.value = Surreal.fromReal(input);
    } else if (! input || ! input.constructor) {
      // Nothing to do.
    } else if (Array.isArray(input)) {
      this.value = input;
    } else if (input.isSurreal) {
      this.value = input.value;
    }
  };

  Surreal.prototype.isSurreal = true;

  // On the first day, Conway created Zero.
  Surreal.zero = function () {
    return [[], []];
  };

  Surreal.prototype.isZero = function () {
    return L(this).length == 0 && R(this).length == 0;
  };

  Surreal.prototype.increment = function () {
    this.value = this.successor().value;
  };

  Surreal.prototype.decrement = function () {
    this.value = this.predecessor().value;
  };

  Surreal.prototype.successor = function () {
    //return new Surreal([this.value, []]);
    var n;
    if (this.isZero() || this.isPositive()) {
      n = new Surreal([this.value, []]);
    } else if (this.isNegative()) {
      n = new Surreal(R(this));
    }
    return n;
  };

  Surreal.prototype.predecessor = function () {
    var n;
    if (this.isZero() || this.isNegative()) {
      n = new Surreal([[], this.value]);
    } else if (this.isPositive()) {
      return new Surreal(L(this));
    }
    return n;
  };


  // Comparisons.
  Surreal.prototype.isEqualTo = function (other) {
    return this.isLessThanOrEqualTo(other) && this.isGreaterThanOrEqualTo(other);
  };

  Surreal.prototype.isPositive = function () {
    return (size(L(this)) > size(R(this)));
  };

  Surreal.prototype.isNegative = function () {
    return (! this.isPositive()) && (! this.isZero())
  };

  Surreal.prototype.isLessThanOrEqualTo = function (other) {
    var first = new Surreal(this);
    var second = new Surreal(other);
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

  Surreal.prototype.isLessThan = function (other) {
    return ! this.isGreaterThanOrEqualTo(other);
  };

  Surreal.prototype.isGreaterThanOrEqualTo = function (other) {
    return other.isLessThanOrEqualTo(this);
  };

  Surreal.prototype.isGreaterThan = function (other) {
    return ! this.isLessThanOrEqualTo(other);
  };

  Surreal.fromReal = function (real) {
    var surreal = new Surreal(Surreal.zero());
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

  Surreal.prototype.toReal = function () {
    var n = new Surreal(this);
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

  return Surreal;

})();
