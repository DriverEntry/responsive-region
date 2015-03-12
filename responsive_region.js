(function _ResponsiveRegions(Backbone, Marionette, $, _) {
    'use strict';
    Marionette.ResponsiveRegion = Marionette.Region.extend({
        constructor : function(options)
        {
            _.extend(this,Backbone.Events);
            Marionette.Region.prototype.constructor.call(this, options);
        },

        show : function(view, options)
        {
            options = _.defaults(options || {}, {
                lookupState : true
            });

            this._unhookCurrentModel();

            if(options.lookupState)
            {
                var lookupOptions = _.isBoolean(options.lookupState) ? {} : options.lookupState;

                _.defaults(lookupOptions, this.defaults, {
                    entities: this._getEntities(view),
                    startState : 'sync',
                    template: false,
                    events : ['sync', 'request', 'error']
                });
                lookupOptions.entities = _.isArray(lookupOptions.entities) ?
                    lookupOptions.entities : [lookupOptions.entities];

                this.template = lookupOptions.template;

                Marionette.Region.prototype.show.call(this, view, options);
                this.lookupOptions = lookupOptions;
                this._getStateChangeInternalHandler(lookupOptions.startState).apply(this);
                this._delegateEvents();
            }
            else
            {
                Marionette.Region.prototype.show.call(this, view, options);
            }
        },
        attachHtml : function(view)
        {
            if(!this.template)
                return Marionette.Region.prototype.attachHtml.call(this);

            var $wrapper = $(Marionette.Renderer.render(this.template));
            $wrapper.find('.js-model-state-sync').add($wrapper.filter('.js-model-state-sync')).empty().append(view.el);

            this.$el.empty().append($wrapper);
        },
        empty : function(){
            this._unhookCurrentModel();
            Marionette.Region.prototype.empty.call(this);
        },
        _delegateEvents : function()
        {
            try
            {
                var eventsHash = this._getHandlersHash();
                _.each(this.lookupOptions.entities, function(entity){
                    _.each(eventsHash, function(handlerName, eventName){
                        this.listenTo(entity, eventName, this._getStateChangeInternalHandler(eventName));
                    }, this);
                }, this);
            }
            catch (e)
            {
                this._undelegateEvents();
                throw e;
            }
        },
        _undelegateEvents : function()
        {
            var entities = _.isArray(this.lookupOptions.entities) ? this.lookupOptions.entities : [this.lookupOptions.entities];
            _.each(entities, function(entity){
                this.stopListening(entity);
            }, this);

        },
        _unhookCurrentModel : function () {
            if (this.lookupOptions && this.lookupOptions.entities)
            {
                this._undelegateEvents();
                this.lookupOptions.entities = null;
            }
        },
        _isBubbled: function (target)
        {
            return target && !_.contains(this.lookupOptions.entities, target)
        },
        _getStateChangeInternalHandler : function(eventName){
            return function(target){
                if (this._isBubbled(target)) return;
                var handler = this._getHandlerForEvent(eventName);
                handler.apply(this, arguments);
                this.state = eventName;
            };
        },
        _getEntities: function(view) {
            return _.chain(view).pick("model", "collection").toArray().compact().value()
        },
        _getHandlersHash : function(){
            var events = this.lookupOptions.events;
            if (!_.isArray(events)) return events;
            var eventsHash = {};
            _.each(events, function(eventName){
                eventsHash[eventName] = this._defaultHandlerNameForEvent(eventName)
            }, this);
            return eventsHash;
        },
        _getHandlerForEvent : function (eventName) {
            var handlersHash = this._getHandlersHash(),
                name = handlersHash[eventName] || this._defaultHandlerNameForEvent(eventName);

            if(!this[name] || typeof this[name] != 'function')
                throw new Error('state change handler ' + name + ' is not defined');

            return this[name];
        },
        _defaultHandlerNameForEvent : function (eventName) {
            return 'handle' + eventName.charAt(0).toUpperCase() +
                eventName.toLowerCase().slice(1);
        }

    });

    Marionette.ResponsiveVisiblityRegion = Marionette.ResponsiveRegion.extend({
        handleRequest : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-error').addClass('hidden');
            this.$el.find('.js-model-state-request').removeClass('hidden');
        },
        handleError : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-error').removeClass('hidden');
        },
        handleSync : function()
        {
            this.$el.find('.js-model-state-error, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-sync').removeClass('hidden');
        },
        defaults :  {
            template : '#responsive-region-visibility-template'
        }
    });

    Marionette.ResponsiveOpacityRegion = Marionette.ResponsiveRegion.extend({
        handleRequest : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-error').css('opacity', 0.5);
        },
        handleError : function()
        {
            this.$el.find('.js-model-state-sync').addClass('hidden');
            this.$el.find('.js-model-state-error').removeClass('hidden').css('opacity', 1);
        },
        handleSync : function()
        {
            this.$el.find('.js-model-state-error').addClass('hidden');
            this.$el.find('.js-model-state-sync').removeClass('hidden').css('opacity', 1);
        },
        defaults : {
            template : '#responsive-region-opacity-template'
        }
    });
})(Backbone, Marionette, $, _);