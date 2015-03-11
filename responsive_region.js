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

            if (this.lookupOptions)
            {
                this.undelegateEvents();
                this.lookupOptions = null;
            }

            if(options.lookupState)
            {
                var lookupOptions = this.lookupOptions = _.isBoolean(options.lookupState) ? {} : options.lookupState;

                _.defaults(lookupOptions, this.defaults, {
                    entities: this._getEntities(view),
                    startState : 'sync',
                    template: '#responsive-region-base-template'
                });
                this.lookupOptions.entities = _.isArray(this.lookupOptions.entities) ?
                    this.lookupOptions.entities : [this.lookupOptions.entities];
            }

            Marionette.Region.prototype.show.call(this, view, options);

            if(options.lookupState)
            {
                this.delegateEvents();
            }
        },
        attachHtml : function(view)
        {
            if(!this.lookupOptions)
            {
                return Marionette.Region.prototype.attachHtml.call(this, view);
            }

            var $content;
            if(this.lookupOptions.template)
            {
                var $wrapper = $(Marionette.Renderer.render(this.lookupOptions.template));
                $wrapper.find('.js-model-state-sync').add($wrapper.filter('.js-model-state-sync')).empty().append(view.el);
                $content = $wrapper;
            }
            else
            {
                $content = $(view.el);
            }

            this.$el.empty().append($content);

            switch (this.lookupOptions.startState)
            {
                case 'request':
                    this._handleRequest();
                    break;
                case 'error':
                    this._handleError();
                    break;
                default:
                    this._handleSync();
            }
            

        },
        delegateEvents : function()
        {
            _.each(this.lookupOptions.entities, function(entity){
                this.listenTo(entity, 'request', this._handleRequest);
                this.listenTo(entity, 'sync', this._handleSync);
                this.listenTo(entity, 'error', this._handleError);
            }, this);


        },
        undelegateEvents : function()
        {
            var entities = _.isArray(this.lookupOptions.entities) ? this.lookupOptions.entities : [this.lookupOptions.entities];
            _.each(entities, function(entity){
                this.stopListening(entity);
            }, this);

        },
        handleRequest : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-error').addClass('hidden');
            this.$el.find('.js-model-state-request').removeClass('hidden');
            this.state = 'request';
        },
        handleError : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-error').removeClass('hidden');
            this.state = 'error';
        },
        handleSync : function()
        {
            this.$el.find('.js-model-state-error, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-sync').removeClass('hidden');
            this.state = 'sync';
        },
        _isBubbled: function (target)
        {
            return target && !_.contains(this.lookupOptions.entities, target)
        },
        _handleRequest : function(target)
        {
            if (this._isBubbled(target)) return;
            this.handleRequest.apply(this, arguments);
            this.state = 'request';
        },
        _handleError: function (target)
        {
            if (this._isBubbled(target)) return;
            this.handleError();
            this.state = 'error';
        },
        _handleSync: function (target)
        {
            if (this._isBubbled(target)) return;
            this.handleSync();
            this.state = 'sync';
        },
        _getEntities: function(view) {
            return _.chain(view).pick("model", "collection").toArray().compact().value()
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