QUnit.module('ResponsiveRegionTest');
var eventSequence = ['request', 'error', 'request', 'sync', 'error', 'request', 'sync' ],
    styleTest = function(name, regionClass,  expectation)
{
    QUnit.test(name, function(assert){
        expect(1);
        var model = new Backbone.Collection(),
            region = new regionClass({el : '#qunit-fixture'}),
            view = new Marionette.View({collection : model});
        region.show(view, {
            lookupState : true
        });
        var checkStyling  = function(events, model, region)
        {
            var results = [];
            _.each(events, function(e)
            {
                model.trigger(e);
                results.push(expectation[e].call(region));
            });
            return results;
        };
        assert.ok(
            _.every(checkStyling(eventSequence, model, region),
                function(r){return r}), 'Wrapping elements are properly styled');

    });
};
QUnit.test("State tracking test", function (assert) {
    expect(6);

    var model1 = new Backbone.Collection(),
        model2 = new Backbone.Collection(),
        region = new  Marionette.ResponsiveVisiblityRegion({el : '#qunit-fixture'}),
        viewWithModel = new Marionette.View({collection : model1}),
        viewWithoutModel = new Marionette.View();

    region.show(viewWithModel, {
        lookupState : {
            startState : 'sync'
        }
    });

    assert.equal(region.state, 'sync', 'Match to start state');

    var traceState = function(model, region, eventSequence) {
            var stateSequence = [];
            _.each(eventSequence, function(e)
            {
                model.trigger(e);
                stateSequence.push(region.state);
            });
            return stateSequence;
        };

    assert.deepEqual(traceState(model1, region, eventSequence),eventSequence,
        'Region follows model state with implicit binding');

    region.show(viewWithoutModel, {
        lookupState : {
            startState : 'request',
            entities : model2
        }});

    assert.equal(region.state, 'request', 'Start state overrides last region state on re-show');

    model1.trigger('sync');
    assert.equal(region.state, 'request', 'First model is not observed after re-show');

    model2.trigger('error');
    assert.equal(region.state, 'error', 'Second model is observed with explicit binding');

    region.show(viewWithModel, {
        lookupState : {
            startState : 'request',
            entities : model2
        }});

    assert.ok(!_.isEqual(eventSequence, traceState(model1, region, eventSequence)) &&
            _.isEqual(eventSequence, traceState(model2, region, eventSequence)),
        'Region doesnt use implicit binding when model is provided with options');
});

styleTest("Visibility region styling test", Marionette.ResponsiveVisiblityRegion, {
    request : function(){
        return !this.$el.find('.js-model-state-request').hasClass('hidden') &&
            this.$el.find('.js-model-state-error').hasClass('hidden') &&
            this.$el.find('.js-model-state-sync').hasClass('hidden');
    },
    error : function(){
        return !this.$el.find('.js-model-state-error').hasClass('hidden') &&
            this.$el.find('.js-model-state-request').hasClass('hidden') &&
            this.$el.find('.js-model-state-sync').hasClass('hidden');
    },
    sync : function(){
        return !this.$el.find('.js-model-state-sync').hasClass('hidden') &&
            this.$el.find('.js-model-state-error').hasClass('hidden') &&
            this.$el.find('.js-model-state-request').hasClass('hidden');
    }
});

styleTest("Opacity region styling test", Marionette.ResponsiveOpacityRegion, {
    request : function(){
        var $items = this.$el.find('.js-model-state-sync'),
            $error = this.$el.find('.js-model-state-error');
        return $items.css('opacity') == 0.5 &&
            $error.css('opacity') == 0.5 && (
            ($items.hasClass('hidden') && !$error.hasClass('hidden')) ||
            (!$items.hasClass('hidden') && $error.hasClass('hidden'))
            );
    },
    error : function(){
        return this.$el.find('.js-model-state-error').css('opacity') == 1 &&
            !this.$el.find('.js-model-state-error').hasClass('hidden')
            this.$el.find('.js-model-state-sync').hasClass('hidden');
    },
    sync : function(){
        return !this.$el.find('.js-model-state-sync').hasClass('hidden') &&
            this.$el.find('.js-model-state-sync').css('opacity')  == 1 &&
            this.$el.find('.js-model-state-error').hasClass('hidden');
    }
});

QUnit.test("Ignore bubbled events", function (assert) {
    var collection = new Backbone.Collection(),
        model = new Backbone.Model(),
        region = new  Marionette.ResponsiveVisiblityRegion({el : '#qunit-fixture'}),
        view = new Marionette.View({collection : collection});
    region.show(view, {
        lookupState : true
    });
    collection.add(model);
    model.trigger('request', model, model.collection);
    assert.equal(region.state, 'sync', 'region ignores bubbled event');
    region.show(view, {
        lookupState : true
    });
});
QUnit.test("Observing multiple models", function (assert) {
    var collection = new Backbone.Collection(),
        model = new Backbone.Model(),
        region = new  Marionette.ResponsiveVisiblityRegion({el : '#qunit-fixture'}),
        view = new Marionette.View({collection : collection});
    region.show(view, {
        lookupState : {
            entities : [collection, model]
        }
    });
    collection.add(model);
    model.trigger('request', model, model.collection);
    assert.equal(region.state, 'request', 'region observes model');

    collection.trigger('error');
    assert.equal(region.state, 'error', 'region observes collection');
});

