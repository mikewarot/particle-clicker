'use strict';

/** Define all objects used in the game.
 * They can be either loaded from localStorage or from JSON in case nothing is
 * found in the localStorage.
 */
var GameObjects = (function() {
  /** Lab
   */
  var labPrototype = {
    version: '0.2',
    name: 'Click here to give your lab a catchy name',
    detector: {
      rate: 1
    },
    factor: {
      rate: 5,
      all: 1,
      all_money: 1,
      all_reputation: 1,
      all_data: 1
    },
    data: 0,
    reputation: 0,
    money: 0,
    getGrant: function () {
      var addition = this.reputation * this.factor.rate * this.factor.all * this.factor.all_money;
      this.money += addition;
      return addition;
    },
    acquire: function(amount) {
      this.data += amount * this.factor.all * this.factor.all_data;
    },
    research: function(cost, reputation) {
      if (this.data >= cost) {
        this.data -= cost;
        this.reputation += reputation * this.factor.all * this.factor.all_reputation;
        return true;
      }
      return false;
    },
    buy: function(cost) {
      if (this.money >= cost) {
        this.money -= cost;
        return true;
      }
      return false;
    },
    sell: function(cost) {
      this.money += cost;
    }
  };
  var lab = $.extend({}, labPrototype, ObjectStorage.load('lab'));

  /** Research
   */
  var researchPrototype = {
    level: 0,
    is_visible: function() {
      return this.level > 0 || lab.data >= this.cost * .7;
    },
    is_available: function() {
      return lab.data >= this.cost;
    },
    research: function() {
      if (lab.research(this.cost, this.reputation)) {
        this.level++;
        analytics.sendEvent(analytics.events.categoryResearch, analytics.events.actionResearch, this.name, this.level);
        var oldCost = this.cost;
        this.cost = Math.round(this.cost * this.cost_increase);
        return oldCost;
      }
      return -1;
    },
    getInfo: function() {
      if (!this._info) {
        this._info = Helpers.loadFile(this.info);
      }
      return this._info;
    },
    showInfo: function() {
      UI.showModal(this.name, this.getInfo());
    }
  };
  var research = $.extend([], Helpers.loadFile('json/research.json'),
                          ObjectStorage.load('research'));
  research = research.map(function(item) {
    return $.extend({}, researchPrototype, item);
  });


  /** Workers
   */
  var workersPrototype = {
    hired: 0,
    is_visible: function() {
      return this.hired > 0 || lab.money >= this.cost * .7;
    },
    is_available: function() {
      return lab.money >= this.cost;
    },
    hire: function() {
      if (lab.buy(this.cost)) {
        this.hired++;
        analytics.sendEvent(analytics.events.categoryHR, analytics.events.actionHire, this.name, this.hired);
        var cost = this.cost;
        this.cost = Math.round(this.cost * this.cost_increase);
        return cost;
      }
      return -1;
    }
  };
  var workers = $.extend([], Helpers.loadFile('json/workers.json'),
                         ObjectStorage.load('workers'));
  workers = workers.map(function(worker) {
    return $.extend({}, workersPrototype, worker);
  });


  /** Upgrades
   */
  var upgradesPrototype = {
    level: 0,
    getReceiver: function() {
      if (this.type === "detector") {
        return lab.detector;
      } else if (this.type === "reputation"){
        return lab.factor;
      } else {
        var context;
        if (this.type === "research") { context = research; }
        else if (this.type === "hr") { context = workers; }
        else { return null; }
        for (var i = 0; i < context.length; i++) {
          if (context[i].name === this.receiver) {
            return context[i];
          }
        }
        return null;
      }
    },
    hasReceiver: function() {
      if (this.type === "detector" || this.type === "reputation") {
        return true;
      }
      var rec = this.getReceiver();
      if (this.type === "research") {
        return rec.level > 0;
      } else if (this.type === "hr") {
        return rec.hired > 0;
      }
      return false;
    },
    is_visible: function() {
      if (this.level > 0 ) {
         return true;
      }
      return this.hasReceiver() && lab.money >= this.cost * .5;
    },
    is_available: function() {
      return this.hasReceiver() && lab.money >= this.cost;
    },
    buy: function() {
      if (lab.buy(this.cost)) {
        analytics.sendEvent(analytics.events.categoryUpgrades, analytics.events.actionBuy, this.name, 1);
        var rec = this.getReceiver();
        if (rec) {
          this.level++;
          rec[this.property] = rec[this.property] * this.factor + (this.constant * (Math.pow (this.cost_increase, this.level-1) ) );
        }
        var cost = this.cost;
        this.cost = Math.round(this.cost * this.cost_increase);
        return cost;
      }
      return -1;
    }
  };
  var upgrades = $.extend([], Helpers.loadFile('json/upgrades.json'),
                         ObjectStorage.load('upgrades'));
  upgrades = upgrades.map(function(upgrade) {
    return $.extend({}, upgradesPrototype, upgrade);
  });


  /** Save all the game objects at once.
   */
  var saveAll = function() {
    ObjectStorage.save('lab', lab);
    ObjectStorage.save('research', research);
    ObjectStorage.save('workers', workers);
    ObjectStorage.save('upgrades', upgrades);
    ObjectStorage.save('achievements', achievements);
  };

  return {
    lab: lab,
    research: research,
    workers: workers,
    upgrades: upgrades,
    saveAll: saveAll
  }
})();
